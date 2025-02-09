"use client"

import React, { useState, useRef } from "react"
import { Upload, Camera, X, Loader2, Leaf, Info, Sun, Droplets, Thermometer, Home } from "lucide-react"
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

interface PlantInfo {
  name: string
  scientificName: string
  confidence: number
  overview: string
  features: string[]
  care: {
    light: string
    water: string
    humidity: string
    temperature: string
  }
  potSizes: string[]
  idealFor: string[]
}

export const PlantIdentifier = () => {
  const [apiKey, setApiKey] = useState("")
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null)

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      localStorage.setItem("gemini_api_key", apiKey)
      setIsApiKeyModalOpen(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      setError("Unable to access camera")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" })
          setSelectedImage(file)
          setImagePreview(canvas.toDataURL("image/jpeg"))
          stopCamera()
        }
      }, "image/jpeg")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setSelectedImage(file)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }

  const identifyPlant = async () => {
    if (!selectedImage) {
      setError("Please select an image first")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.readAsDataURL(selectedImage)
      reader.onloadend = async () => {
        const base64Image = reader.result as string
        const base64Data = base64Image.split(',')[1]

        const apiKey = localStorage.getItem("gemini_api_key")
        if (!apiKey) {
          setError("API key not found. Please enter your API key.")
          setIsApiKeyModalOpen(true)
          setLoading(false)
          return
        }

        const prompt = `Analyze this plant image and provide detailed information in the following JSON format:
        {
          "name": "Common name of the plant",
          "scientificName": "Scientific name",
          "confidence": "Confidence percentage (number between 0-100)",
          "overview": "Brief description of the plant",
          "features": ["Key feature 1", "Key feature 2", "Key feature 3", "Key feature 4"],
          "care": {
            "light": "Light requirements",
            "water": "Watering needs",
            "humidity": "Humidity requirements",
            "temperature": "Temperature range"
          },
          "potSizes": ["Size option 1", "Size option 2", "Size option 3", "Size option 4"],
          "idealFor": ["Location 1", "Location 2", "Location 3", "Location 4"]
        }`

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: "image/jpeg",
                        data: base64Data
                      }
                    }
                  ]
                }
              ]
            })
          }
        )

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          try {
            const result = JSON.parse(data.candidates[0].content.parts[0].text)
            setPlantInfo(result)
          } catch (e) {
            setError("Failed to parse plant information")
          }
        } else {
          setError("No plant information received")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to identify plant")
    } finally {
      setLoading(false)
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* API Key Modal */}
      <Dialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Gemini API Key</DialogTitle>
            <DialogDescription>
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Image Upload/Camera Section */}
        {!selectedImage && !isCameraActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <span className="text-muted-foreground">Upload an image</span>
                <span className="text-sm text-muted-foreground mt-2">
                  Max file size: 5MB
                </span>
              </label>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <button
                onClick={startCamera}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <span className="text-muted-foreground">Take a photo</span>
                <span className="text-sm text-muted-foreground mt-2">
                  Using your camera
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isCameraActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-4">
                  <Button onClick={capturePhoto} variant="secondary">
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="secondary">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Selected plant"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={resetIdentification}
                  className="absolute top-2 right-2 p-1 bg-background rounded-full shadow-lg"
                >
                  <X className="h-5 w-5" />
                </button>
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
                  <p>{plantInfo.overview}</p>
                </TabsContent>

                <TabsContent value="features">
                  <ul className="space-y-2">
                    {plantInfo.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="mr-2">✅</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="care">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Sun className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Light</p>
                        <p className="text-sm text-muted-foreground">
                          {plantInfo.care.light}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Droplets className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Water</p>
                        <p className="text-sm text-muted-foreground">
                          {plantInfo.care.water}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Thermometer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Temperature</p>
                        <p className="text-sm text-muted-foreground">
                          {plantInfo.care.temperature}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Droplets className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Humidity</p>
                        <p className="text-sm text-muted-foreground">
                          {plantInfo.care.humidity}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">🪴 Pot Size Options</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {plantInfo.potSizes.map((size, index) => (
                        <li key={index}>{size}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">🏡 Ideal For</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {plantInfo.idealFor.map((location, index) => (
                        <li key={index} className="flex items-center">
                          <Home className="h-4 w-4 mr-2" />
                          {location}
                        </li>
                      ))}
                    </ul>
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