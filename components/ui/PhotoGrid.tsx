'use client';

import Image from 'next/image';
import { useState } from 'react';
import PhotoModal from './PhotoModal';

interface Photo {
  id: number;
  src: string;
}

interface PhotoGridProps {
  photos?: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const defaultPhotos: Photo[] = [
    { id: 1, src: '/post-1.JPG' },
    { id: 2, src: '/post-2.JPG' },
    { id: 3, src: '/post-3.JPG' },
    // { id: 4, src: '/post-1.JPG' },
    // { id: 5, src: '/post-2.JPG' },
    // { id: 6, src: '/post-3.JPG' },
    // { id: 7, src: '/post-1.JPG' },
    // { id: 8, src: '/post-2.JPG' },
    // { id: 9, src: '/post-3.JPG' },
    // { id: 10, src: '/post-1.JPG' },
    // { id: 11, src: '/post-2.JPG' },
    // { id: 12, src: '/post-3.JPG' }
  ];

  const displayPhotos = photos || defaultPhotos;

  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {displayPhotos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square relative cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openModal(photo)}
          >
            <Image
              src={photo.src}
              alt={`Post ${photo.id}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
      
      <PhotoModal
        src={selectedPhoto?.src || ''}
        alt={selectedPhoto ? `Post ${selectedPhoto.id}` : ''}
        isOpen={!!selectedPhoto}
        onClose={closeModal}
      />
    </>
  );
}