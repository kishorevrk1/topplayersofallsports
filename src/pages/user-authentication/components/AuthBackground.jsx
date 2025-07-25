import React from 'react';
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

  const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/80 z-10"></div>
      <Image
        src={randomImage.src}
        alt={randomImage.alt}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-white p-12">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mx-auto mb-4">
              <Icon name="Trophy" size={32} color="white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Join the Ultimate Sports Community
            </h2>
            <p className="text-lg opacity-90">
              Get personalized news, follow your favorite players, and never miss a highlight.
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="Star" size={16} color="white" />
              </div>
              <span>Personalized sports feed</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="Bell" size={16} color="white" />
              </div>
              <span>Real-time breaking news alerts</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="Play" size={16} color="white" />
              </div>
              <span>Exclusive highlight videos</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="Users" size={16} color="white" />
              </div>
              <span>Follow favorite players & teams</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthBackground;