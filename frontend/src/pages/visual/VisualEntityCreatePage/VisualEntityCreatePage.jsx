import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast.jsx';
import { visualEntityService } from '../../../services/visualEntityService';
import { Button } from '../../../components/ui/Button';
import './VisualEntityCreatePage.css';

const VisualEntityCreatePage = () => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const toast = useToast();

    // Clean up preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const selectedFile = droppedFiles[0];
            if (selectedFile.type.startsWith('image/')) {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setFile(selectedFile);
                setPreviewUrl(URL.createObjectURL(selectedFile));
                setError(null);
            } else {
                setError("Please upload an image file.");
            }
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.warning("No Image Selected", "Please select an image first.");
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            await visualEntityService.createVisualEntity(formData);
            toast.success("Visual Added", "Your image has been successfully added to the collection.");
            setTimeout(() => navigate('/visuals'), 1500);
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Upload Failed", "The image could not be uploaded. Please try again.");
            setError(err.message || "Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="visual-page-container">
            <div className="container mx-auto px-4 relative">
                {/* Glow Effects */}
                <div className="visual-page-glow-purple" />
                <div className="visual-page-glow-blue" />

                <div className="max-w-3xl mx-auto relative z-10">
                    <header className="text-center mb-12">
                        <div className="visual-hero-badge">
                            <span className="visual-hero-badge-dot" />
                            Create New Scenery
                        </div>
                        <h1 className="visual-hero-title">
                            Upload <br />
                            <span className="visual-hero-vibe">Visual.</span>
                        </h1>
                    </header>

                    <form onSubmit={handleUpload} className="upload-form">
                        <div
                            className="dropzone"
                            onClick={() => fileInputRef.current.click()}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="preview-img" />
                            ) : (
                                <div className="upload-placeholder">
                                    <span>Click to select or drag and drop an image</span>
                                </div>
                            )}
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <div className="form-actions justify-center mt-8">
                            <Button
                                type="submit"
                                className="visual-explore-btn"
                                disabled={!file || uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload Image'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="visual-create-btn-cancel"
                                onClick={() => navigate('/visuals')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VisualEntityCreatePage;
