import React, { useState, useEffect } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';


const AuthBackground = () => {
  const backgroundImages = [
    {
      src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      alt: "Basketball player in action"
    },
    {
      src: "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=2070&q=80",
      alt: "Soccer player kicking ball"
    },
    {
      src: "https://images.pixabay.com/photo/2016/11/29/13/14/american-football-1869438_1280.jpg?auto=compress&cs=tinysrgb&w=2070&q=80",
      alt: "American football action"
    }
  ];

  const [randomImage, setRandomImage] = useState(backgroundImages[0]); // Default to first image

  useEffect(() => {
    // Set random image only once when component mounts
    const selectedImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    setRandomImage(selectedImage);
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 flex-col justify-between">
      <div>
        <h2 className="text-3xl font-bold text-white">
          Welcome to the Ultimate Sports Hub
        </h2>
        <p className="text-white/80 mt-4">
          Track your favorite players, get live scores, and never miss a moment.
        </p>
      </div>
      <div className="text-white/60 text-sm">
        &copy; {new Date().getFullYear()} TopPlayersofAllSports
      </div>
    </div>
  );
};

export default AuthBackground;