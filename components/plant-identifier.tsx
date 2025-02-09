"use client"

import React, { useState, useRef, ChangeEvent, useEffect } from "react"
import { Upload, Camera, X, Loader2, Leaf, Info, Sun, Droplets, Thermometer, Home, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import { AuthModal } from "@/components/auth/auth-modal"
import { ApiKeyModal } from "@/components/api-key-modal"
import Link from "next/link"

interface PlantCare {
  light: string;
  water: string;
  humidity: string;
  temperature: string;
  soil: string;
  fertilizer: string;
}

interface PlantInfo {
  name: string;
  scientificName: string;
  description: string;
  confidence: number;
  keyFeatures: string[];
  care: PlantCare;
  commonProblems: string[];
  propagation: string;
  growthRate: string;
}

export const PlantIdentifier = () => {
  const [apiKey, setApiKey] = useState("")
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { data: session } = useSession()
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      localStorage.setItem("gemini_api_key", apiKey)
      setIsApiKeyModalOpen(false)
    }
  }

  const startCamera = async () => {
    try {
      // Add specific constraints for mobile devices
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        setIsCameraActive(true);
        setError(""); // Clear any previous errors
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setError("Camera access denied. Please enable camera permissions.");
            break;
          case 'NotFoundError':
            setError("No camera found on your device.");
            break;
          case 'NotReadableError':
            setError("Camera is already in use by another application.");
            break;
          default:
            setError("Unable to access camera. Please try again.");
        }
      } else {
        setError("Unable to access camera. Please try again.");
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      
      // Use the actual video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // If the video is mirrored, flip the canvas context
      if (video.style.transform.includes('scaleX(-1)')) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
        if (blob) {
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            setSelectedImage(URL.createObjectURL(file));
            setImagePreview(canvas.toDataURL("image/jpeg"));
            stopCamera();
          }
        },
        "image/jpeg",
        0.8 // Adjust quality if needed
      );
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const apiKey = localStorage.getItem('geminiApiKey')
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }
    
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Clear previous state
      setPlantInfo(null);
      setError(null);
      setLoading(true);
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Show server error details if available
        throw new Error(data.details || data.error || 'Identification failed');
      }

      // Add validation for required fields
      if (
        !data.plantData?.name || 
        !data.plantData?.scientificName || 
        !data.plantData?.care?.light ||
        !data.plantData?.care?.water
      ) {
        console.error('Invalid plant data:', data);
        throw new Error('Incomplete plant data received');
      }

      setPlantInfo(data.plantData);
      setError(null);

    } catch (err) {
      let errorData;
      if (response) {
        try {
          errorData = await response.json();
        } catch {
          errorData = undefined;
        }
      }
      
      const errorMessage = err instanceof Error ? 
        `${err.message} - Try a clear photo of a single plant` : 
        'Identification failed - Please try again';
      setError(errorMessage);
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', {
          error: err,
          responseData: errorData
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const identifyPlant = async () => {
    let response: Response | undefined;
    
    try {
      response = await fetch('/api/identify', {
        method: 'POST',
        body: JSON.stringify({ image: selectedImage }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Identification failed');
      }

      const data = await response.json();
      setPlantInfo(data.plantData);
      
    } catch (err) {
      let errorData;
      if (response) {
        try {
          errorData = await response.json();
        } catch {
          errorData = undefined;
        }
      }
      
      console.error('Error details:', {
        error: err,
        responseData: errorData
      });
    } finally {
      setLoading(false);
    }
  }

  const resetIdentification = () => {
    setSelectedImage(null)
    setImagePreview("")
    setPlantInfo(null)
    setError("")
  }

  const howToCards = [
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: "Take or Upload a Photo",
      description: "Capture a clear photo of your plant or upload an existing one. Ensure good lighting and focus on the leaves."
    },
    {
      icon: <Leaf className="h-8 w-8 text-primary" />,
      title: "Get Instant Identification",
      description: "Our AI will analyze the image and provide detailed information about your plant species."
    },
    {
      icon: <Info className="h-8 w-8 text-primary" />,
      title: "Learn & Care",
      description: "Receive comprehensive care instructions and tips to help your plant thrive."
    }
  ]

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ApiKeyModal show={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />
      {/* API Key Modal */}
      <Dialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Gemini API Key</DialogTitle>
            <DialogDescription>
              Get your API key from Google AI Studio
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Save API Key
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Plant Identifier</h1>
          <p className="text-muted-foreground">
            Identify and learn about any plant instantly
          </p>
        </div>

        {/* How To Use Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howToCards.map((card, index) => (
            <Card key={index} className="bg-card">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">{card.icon}</div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && <ErrorAlert error={error} />}

        {/* Image Upload/Camera Section */}
        {!selectedImage && !isCameraActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Button - Now first */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <label 
                htmlFor="file-upload"
                className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer p-8 rounded-lg transition-colors"
              >
                <Upload className="h-12 w-12 mb-4" />
                <span className="font-medium">Upload Photo</span>
                <span className="text-sm mt-2">
                  From your device
                </span>
                <input 
                  id="file-upload"
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Camera Button - Now second */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Link 
                href="/camera" 
                className="w-full h-full flex flex-col items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 p-8 rounded-lg transition-colors"
              >
                <Camera className="h-12 w-12 mb-4" />
                <span className="font-medium">Take a Photo</span>
                <span className="text-sm mt-2 text-emerald-100">
                  Using your camera
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isCameraActive && (
              <div className="relative w-full max-w-xl mx-auto">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted // Add muted attribute for mobile
                  className="w-full h-64 object-cover rounded-lg bg-muted"
                  style={{ transform: 'scaleX(-1)' }} // Optional: mirror the camera view
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-4 z-10">
                  <Button 
                    onClick={capturePhoto} 
                    variant="secondary"
                    className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                  </Button>
                  <Button 
                    onClick={() => {
                      stopCamera();
                      setError("");
                    }} 
                    variant="secondary"
                    className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!plantInfo && !isCameraActive && (
              <Button
                onClick={identifyPlant}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Identifying Plant...
                  </>
                ) : (
                  <>
                    <Leaf className="mr-2 h-4 w-4" />
                    Identify Plant
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Plant Information */}
        {plantInfo && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">{plantInfo.name}</h2>
                  <p className="text-muted-foreground italic">
                    {plantInfo.scientificName}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-3 py-1 rounded-full text-sm">
                  {plantInfo.confidence}% Match
                </div>
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Key Features</TabsTrigger>
                  <TabsTrigger value="care">Care Instructions</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <p>{plantInfo.description}</p>
                </TabsContent>

                <TabsContent value="features">
                  <ul className="space-y-2">
                    {plantInfo.keyFeatures.map((feature, index) => (
                      <li 
                        key={`feature-${index}`}
                        className="flex items-center"
                      >
                        <span className="mr-2">✅</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="care">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(plantInfo.care).map(([key, value]) => (
                      <div 
                        key={key}
                        className="flex items-start space-x-3"
                      >
                        <span className="font-medium capitalize text-muted-foreground">{key}:</span>
                        <p className="text-sm text-muted-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Common Problems</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {plantInfo.commonProblems.map((problem, index) => (
                        <li 
                          key={`problem-${index}`}
                          className="text-sm text-muted-foreground"
                        >
                          {problem}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Propagation</h3>
                    {(typeof plantInfo.propagation === 'string' 
                      ? plantInfo.propagation.split('.') 
                      : plantInfo.propagation || []
                    ).map((method, index) => (
                      <p 
                        key={`propagation-${index}`}
                        className="text-sm text-muted-foreground"
                      >
                        {method.trim()}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Growth Rate</h3>
                    <p className="text-sm text-muted-foreground">
                      {plantInfo.growthRate}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorAlert({ error }: { error: string | null }) {
  if (!error) return null
  
  return (
    <div className="bg-red-50 p-4 rounded-lg mt-4">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-medium">Something went wrong</h3>
      </div>
      <p className="text-red-600 mt-2 text-sm">
        {error.includes('Try a clear photo') ? error : 'Please try again later'}
      </p>
    </div>
  )
}
