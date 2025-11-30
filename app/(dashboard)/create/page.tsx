"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATA_CATEGORIES } from "@/constants/categories";
import { uploadToArweave } from "@/lib/arweave";
import { createListing } from "@/lib/contracts";
import { toast } from "@/components/ui/toast";
import { Upload, File, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CreateListingPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [arweaveTxId, setArweaveTxId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Reset upload state if file changes
      setArweaveTxId(null);
      setUploadProgress(0);
    }
  };

  const handleCreate = async () => {
    if (!file || !title || !category || !description || !price) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Arweave
      const txId = await uploadToArweave(file, (progress) => {
        setUploadProgress(progress);
      });
      setArweaveTxId(txId);
      
      toast.success("File uploaded to Arweave successfully!");

      // 2. Create Smart Contract Listing
      await createListing(
        txId,
        title,
        category,
        description,
        price,
        file.size
      );

      toast.success("Listing created successfully!");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create listing");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
      {/* Left Panel - Form */}
      <div className="p-8 border-r border-neutral-800 flex flex-col gap-8">
        <h1 className="text-4xl font-bold uppercase tracking-tight font-display">Create Listing</h1>
        
        <div className="space-y-6">
          {/* File Upload */}
          <div className="relative group">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={cn(
                "flex flex-col items-center justify-center h-48 border-2 border-dashed border-neutral-800 bg-neutral-950 cursor-pointer hover:border-high-viz-yellow hover:bg-neutral-900 transition-colors",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {file ? (
                <div className="text-center">
                   <File className="w-12 h-12 mx-auto mb-2 text-high-viz-yellow" />
                   <p className="font-mono text-sm">{file.name}</p>
                   <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                   {arweaveTxId && (
                     <div className="flex items-center justify-center gap-2 mt-2 text-green-500">
                       <CheckCircle2 className="w-4 h-4" />
                       <span className="text-xs uppercase tracking-wider">Uploaded</span>
                     </div>
                   )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground group-hover:text-white">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="uppercase tracking-widest text-sm">Click to select file</p>
                </div>
              )}
            </label>
            {isUploading && (
              <div className="absolute bottom-0 left-0 h-1 bg-high-viz-yellow transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Title</label>
            <Input 
              placeholder="ENTER LISTING TITLE" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Category</label>
              <Select onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="SELECT CATEGORY" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Price (USDT)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Description</label>
            <textarea 
              className="w-full h-32 p-3 bg-neutral-950 border border-neutral-800 text-white font-mono text-sm focus:outline-none focus:border-high-viz-yellow resize-none"
              placeholder="Enter file description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button 
            variant="primary" 
            className="w-full mt-4" 
            size="lg"
            onClick={handleCreate}
            disabled={isUploading || !file}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                UPLOADING TO ARWEAVE ({uploadProgress}%)
              </>
            ) : (
              "CREATE LISTING"
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="hidden lg:flex bg-neutral-950 items-center justify-center p-8 relative overflow-hidden">
        {/* Wireframe background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />
        
        <div className="w-full max-w-md border border-neutral-800 bg-black p-1 relative z-10 shadow-2xl">
          <div className="border border-neutral-800 bg-neutral-950 p-6 space-y-4">
            <div className="h-40 bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <span className="text-neutral-700 font-mono text-xs">PREVIEW</span>
            </div>
            <div className="space-y-2">
              <div className="h-6 w-3/4 bg-neutral-800" />
              <div className="h-4 w-1/2 bg-neutral-900" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-3 w-full bg-neutral-900" />
              <div className="h-3 w-full bg-neutral-900" />
              <div className="h-3 w-2/3 bg-neutral-900" />
            </div>
            <div className="pt-6">
               <div className="h-10 w-full bg-high-viz-yellow" />
            </div>
          </div>
          {/* Decorators */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-white" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white" />
        </div>
      </div>
    </div>
  );
}

