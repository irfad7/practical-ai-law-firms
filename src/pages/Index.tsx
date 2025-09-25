import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Play, Users, Settings } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
// import OfferBanner from '@/components/OfferBanner';

const Index = () => {
  const [isFromFacebook, setIsFromFacebook] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    
    if (source === 'fb') {
      setIsFromFacebook(true);
    }
  }, []);

  // Force page to top on load and prevent scroll restoration
  useEffect(() => {
    // Immediately scroll to top
    window.scrollTo(0, 0);
    
    // Prevent browser from restoring scroll position
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Force scroll to top multiple times to override any async behavior
    const forceTop = () => {
      window.scrollTo(0, 0);
    };
    
    forceTop();
    setTimeout(forceTop, 0);
    setTimeout(forceTop, 100);
    setTimeout(forceTop, 500);
    
    // Also prevent any scroll events during initial load
    const preventScroll = () => {
      window.scrollTo(0, 0);
    };
    
    window.addEventListener('scroll', preventScroll);
    
    // Remove scroll prevention after page is fully loaded
    const cleanup = setTimeout(() => {
      window.removeEventListener('scroll', preventScroll);
    }, 1000);
    
    return () => {
      clearTimeout(cleanup);
      window.removeEventListener('scroll', preventScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Offer Banner */}
      {/* <OfferBanner /> */
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border" style={{ marginTop: '0px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src="https://mylegalacademy.com/wp-content/uploads/2024/02/6421617a227524146f1d195b_logo.webp"
                alt="MyLegalAcademy Logo"
                className="h-10 w-auto"
                style={{ maxHeight: '40px' }}
              />
              <h1 className="text-2xl font-bold text-foreground">Practical AI for Law Firms</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link to="/masterclass">
                <Button variant="success" size="default" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Watch Workshop
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" size="default" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Hidden for Facebook users */}
      {!isFromFacebook && (
        <section className="hero-section py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Practical AI for Law Firms
            </h2>
            <p className="text-xl text-hero-foreground/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Learn how to implement AI-powered intake systems and digital teammates to convert leads into signed clients faster and more efficiently. 
              Master the 11-stage blueprint that helps law firms respond to leads within 37 seconds.
            </p>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isFromFacebook ? 'py-8' : 'py-12'}`}>

        <div className={isFromFacebook ? "mb-16" : "grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"}>
          {/* Left Column - Info Cards (Hidden for Facebook users) */}
          {!isFromFacebook && (
            <div className="space-y-8">
              <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-muted to-muted/50 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-success/10 p-2 rounded-lg">
                      <Play className="h-6 w-6 text-success" />
                    </div>
                    Lead to Retainer Workshop
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Watch our comprehensive workshop covering AI-powered intake systems, digital teammates, 
                    and the 11-stage blueprint to convert leads into signed retainers faster.
                  </p>
                  <Link to="/masterclass">
                    <Button variant="success" size="lg" className="w-full">
                      Start Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-muted to-muted/50 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-professional-blue/10 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-professional-blue" />
                    </div>
                    Expert Guidance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Get insights from legal AI experts who have helped hundreds of firms 
                    successfully integrate AI into their workflows and increase efficiency by 40%+.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Right Column - Chat Interface */}
          <div ref={chatRef} className={isFromFacebook ? "max-w-2xl mx-auto" : "lg:pl-8"}>
            <ChatInterface />
          </div>
        </div>

        {/* Features Section - Hidden for Facebook users */}
        {!isFromFacebook && (
          <section className="section-divider py-16">
            <div className="bg-card rounded-xl shadow-xl p-12 border border-border">
              <h3 className="text-3xl font-bold text-center mb-12 text-foreground">What You'll Learn</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="bg-success/10 rounded-xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-success/20 transition-colors duration-200">
                    <MessageCircle className="h-10 w-10 text-success" />
                  </div>
                  <h4 className="font-semibold mb-3 text-lg text-foreground">AI-Powered Intake Systems</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Learn how digital teammates can respond to leads within 37 seconds and qualify prospects automatically.
                  </p>
                </div>
                <div className="text-center group">
                  <div className="bg-professional-blue/10 rounded-xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-professional-blue/20 transition-colors duration-200">
                    <Play className="h-10 w-10 text-professional-blue" />
                  </div>
                  <h4 className="font-semibold mb-3 text-lg text-foreground">Lead to Retainer Blueprint</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Master the 11-stage process that converts leads into signed clients faster and more efficiently.
                  </p>
                </div>
                <div className="text-center group">
                  <div className="bg-gold-accent/10 rounded-xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold-accent/20 transition-colors duration-200">
                    <Users className="h-10 w-10 text-gold-accent" />
                  </div>
                  <h4 className="font-semibold mb-3 text-lg text-foreground">Digital Teammates</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Implement voice AI and chatbot systems that work 24/7 to capture and qualify leads.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
