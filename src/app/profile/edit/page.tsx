"use client";
import { useAuth } from '@/providers/AuthContext';
import { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Camera, Loader2, Save, User, Mail, X } from 'lucide-react';
import Link from 'next/link';
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function EditProfilePage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);

    // Image Upload & Crop State
    const [image, setImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [filter, setFilter] = useState('none');
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const FILTERS = [
        { name: 'Original', value: 'none' },
        { name: 'Mono', value: 'grayscale(100%) contrast(1.1)' },
        { name: 'Noir', value: 'grayscale(100%) contrast(1.5) brightness(0.8)' },
        { name: 'Vintage', value: 'sepia(60%) contrast(1.1) brightness(1.05)' },
        { name: 'Fade', value: 'brightness(1.1) contrast(0.8) saturate(0.8) sepia(10%)' },
        { name: 'Vibrant', value: 'saturate(1.8) contrast(1.1)' },
        { name: 'Golden', value: 'sepia(30%) saturate(1.4) brightness(1.1)' },
        { name: 'Cinema', value: 'contrast(1.2) brightness(1.1) saturate(1.1) sepia(5%)' }
    ];

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImage(reader.result as string);
                setRotation(0);
                setFilter('none');
                setZoom(1);
                setShowCropper(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleUploadCroppedImage = async () => {
        if (!image || !croppedAreaPixels || !user) {
            alert("Please select and crop an image first.");
            return;
        }

        setLoading(true);
        try {
            console.log("Starting crop...");
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels, rotation, filter);
            if (!croppedBlob) throw new Error("Failed to crop image - Blob creation failed.");

            console.log("Uploading to Firebase Storage...");
            const storageRef = ref(storage, `profiles/${user.uid}.jpg`);

            // Upload the blob
            const snapshot = await uploadBytes(storageRef, croppedBlob);
            console.log("Upload successful, fetching URL...");

            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log("Updating auth profile...");
            await updateProfile(user, { photoURL: downloadURL });

            // Critical: Refresh user context
            await refreshUser();

            setShowCropper(false);
            setImage(null);
            alert("Profile picture updated successfully!");
        } catch (error: any) {
            console.error("Error in profile picture update:", error);
            alert(`Update failed: ${error.message || "Unknown error"}. Check your connection.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await updateProfile(user, { displayName: name });
            await refreshUser();
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-10 px-5 pt-4 font-sans selection:bg-neon-lime/30 transition-colors duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pt-0 px-0">
                <Link href="/profile" className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Profile</h1>
                </div>
            </div>

            {/* Profile Pic Section */}
            <div className="flex flex-col items-center mb-10">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-28 h-28 rounded-full border-4 border-card overflow-hidden bg-accent relative">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neon-lime text-black text-3xl font-bold">
                                {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                    <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-neon-lime flex items-center justify-center text-black border-2 border-background shadow-lg">
                        <Camera size={14} />
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                <p className="mt-3 text-muted-foreground text-sm font-medium">Tap to change photo</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col">
                <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-card text-foreground border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 transition-all font-medium"
                                placeholder="Your Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative opacity-50">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-card text-muted-foreground border border-border rounded-2xl py-3 pl-12 pr-4 cursor-not-allowed font-medium"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 ml-1 font-medium">Email cannot be changed</p>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-neon-lime text-black font-bold py-3 rounded-full mt-auto hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(223,255,79,0.2)] disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </form>

            {/* Cropper Modal */}
            {showCropper && image && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <h2 className="text-white font-bold">Edit Photo</h2>
                        <button onClick={() => setShowCropper(false)} className="text-white/60 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable controls */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        <div className="flex flex-col items-center">
                            <div className="relative w-full aspect-square max-h-[45vh] bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0">
                                <Cropper
                                    image={image}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    style={{
                                        mediaStyle: { filter: filter }
                                    }}
                                />
                            </div>

                            <div className="w-full mt-8 space-y-8">
                                {/* Filters */}
                                <div className="space-y-4">
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-4">Filters</p>
                                    <div className="flex gap-3 overflow-x-auto pb-4 px-4 -mx-4 scrollbar-hide">
                                        {FILTERS.map((f) => (
                                            <button
                                                key={f.name}
                                                type="button"
                                                onClick={() => setFilter(f.value)}
                                                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[11px] font-bold transition-all border ${filter === f.value
                                                        ? 'bg-neon-lime text-black border-neon-lime shadow-[0_0_15px_rgba(223,255,79,0.4)]'
                                                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Zoom */}
                                <div className="px-1">
                                    <div className="flex justify-between mb-3 text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">
                                        <span>Zoom</span>
                                        <span className="text-neon-lime">{Math.round(zoom * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-lime"
                                    />
                                </div>

                                {/* Rotation */}
                                <div className="px-1">
                                    <div className="flex justify-between mb-3 text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">
                                        <span>Rotate</span>
                                        <span className="text-neon-lime">{rotation}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        value={rotation}
                                        min={0}
                                        max={360}
                                        step={1}
                                        aria-labelledby="Rotate"
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-lime"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Buffer for bottom buttons */}
                        <div className="h-28"></div>
                    </div>

                    {/* Fixed Action Buttons */}
                    <div className="p-6 bg-black border-t border-white/5 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowCropper(false)}
                            className="flex-1 py-4 rounded-full bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUploadCroppedImage}
                            disabled={loading}
                            className="flex-1 py-4 rounded-full bg-neon-lime text-black text-sm font-bold hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(223,255,79,0.3)] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin size-4" /> : "Set Photo"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
