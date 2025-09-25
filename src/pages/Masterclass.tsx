import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Phone, Calendar, X, Check, ArrowRight, CreditCard, Users, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ChatInterface from '@/components/ChatInterface';
// import OfferBanner from '@/components/OfferBanner';

interface AccessFormData {
  fullName: string;
  email: string;
  phone: string;
  firmName: string;
  practiceArea: string;
}

interface UserAccess {
  email: string;
  fullName: string;
  firmName: string;
  expiresAt: number;
}

const Masterclass = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [formData, setFormData] = useState<AccessFormData>({
    fullName: '',
    email: '',
    phone: '',
    firmName: '',
    practiceArea: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<AccessFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatbotPosition, setChatbotPosition] = useState('16px');
  
  // Modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [contactStep, setContactStep] = useState(1);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'annual'>('annual');
  const [leftButtonOpacity, setLeftButtonOpacity] = useState(1);
  const [rightButtonOpacity, setRightButtonOpacity] = useState(1);
  
  const [contactFormData, setContactFormData] = useState({
    firstName: '',
    lastName: '',
    email: userAccess?.email || '',
    phone: '',
    firmName: userAccess?.firmName || '',
    practiceArea: '',
    firmSize: '',
    message: ''
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Check for company domain (not free email providers)
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1].toLowerCase();
    return !freeEmailDomains.includes(domain);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const grantAccess = useCallback(async (email: string, fullName: string, firmName: string) => {
    const accessData: UserAccess = {
      email,
      fullName,
      firmName,
      expiresAt: Date.now() + (48 * 60 * 60 * 1000) // 48 hours
    };
    
    sessionStorage.setItem('aitrack-access', JSON.stringify(accessData));
    setUserAccess(accessData);
    setHasAccess(true);
    
    // Send tracking webhook
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/97l9HRK2FQf6v9i8xmYO/webhook-trigger/masterclass-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          firmName,
          accessGranted: new Date().toISOString(),
          source: email === formData.email ? 'form' : 'url_parameter'
        })
      });
    } catch (error) {
      console.error('Tracking webhook failed:', error);
    }
  }, [formData.email]);

  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    const source = urlParams.get('source');
    const accessFromUrl = urlParams.get('access');
    
    if (emailFromUrl) {
      grantAccess(emailFromUrl, '', '');
    } else if (accessFromUrl === 'true') {
      // Auto-grant access when ?access=true
      grantAccess('direct-access@temp.com', 'Direct Access User', 'Workshop Access');
    } else if (source === 'fb' || source === "training") {
      // Auto-grant access for social media users
      grantAccess('social-user@temp.com', 'Workshop Attendee', 'Law Firm');
    } else {
      // Check session storage
      const storedAccess = sessionStorage.getItem('aitrack-access');
      if (storedAccess) {
        const access = JSON.parse(storedAccess) as UserAccess;
        if (access.expiresAt > Date.now()) {
          setUserAccess(access);
          setHasAccess(true);
        } else {
          sessionStorage.removeItem('aitrack-access');
        }
      }
    }
  }, [grantAccess]);

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

  // Handle button visibility based on scroll position (desktop only)
  useEffect(() => {
    const handleButtonVisibility = () => {
      // Only apply on desktop (lg and above)
      if (window.innerWidth < 1024) {
        setLeftButtonOpacity(1);
        setRightButtonOpacity(1);
        return;
      }

      const leftButton = document.querySelector('[data-left-button]');
      const rightButton = document.querySelector('[data-right-button]');
      
      if (!leftButton || !rightButton) return;

      const leftButtonRect = leftButton.getBoundingClientRect();
      const rightButtonRect = rightButton.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if both buttons are visible on screen
      const leftVisible = leftButtonRect.top < viewportHeight && leftButtonRect.bottom > 0;
      const rightVisible = rightButtonRect.top < viewportHeight && rightButtonRect.bottom > 0;

      if (leftVisible && rightVisible) {
        // Both buttons are visible, fade based on scroll position
        const scrollProgress = window.scrollY;
        const leftButtonTop = leftButtonRect.top + window.scrollY;
        const rightButtonTop = rightButtonRect.top + window.scrollY;
        
        // Calculate midpoint between buttons
        const midpoint = (leftButtonTop + rightButtonTop) / 2;
        
        if (scrollProgress < midpoint) {
          // Closer to left button
          setLeftButtonOpacity(1);
          setRightButtonOpacity(0);
        } else {
          // Closer to right button
          setLeftButtonOpacity(0);
          setRightButtonOpacity(1);
        }
      } else {
        // Only one or neither button is visible
        setLeftButtonOpacity(1);
        setRightButtonOpacity(1);
      }
    };

    handleButtonVisibility();
    window.addEventListener('scroll', handleButtonVisibility);
    window.addEventListener('resize', handleButtonVisibility);

    return () => {
      window.removeEventListener('scroll', handleButtonVisibility);
      window.removeEventListener('resize', handleButtonVisibility);
    };
  }, []);

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);
    
    // Validate form
    const errors: Partial<AccessFormData> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!validateEmail(formData.email)) {
      errors.email = 'Please use your work email address';
    }
    
    if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.firmName.trim()) {
      errors.firmName = 'Law firm name is required';
    }
    
    if (!formData.practiceArea) {
      errors.practiceArea = 'Please select a practice area';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Send to GHL webhook
      await fetch('https://services.leadconnectorhq.com/hooks/97l9HRK2FQf6v9i8xmYO/webhook-trigger/masterclass-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // For regular traffic (not source=fb): send to API, store in sessionStorage, and redirect
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get('source');
      
      if (source !== 'fb') {
        // Send form data to webhook via Supabase Edge Function
        await fetch('https://uavilthuyclqjnxgjmwr.supabase.co/functions/v1/submit-form-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            practice_area: formData.practiceArea,
            firm_name: formData.firmName,
            source: 'form'
          })
        });

        // Store form data in sessionStorage
        const userFormData = {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          practice_area: formData.practiceArea,
          firm_name: formData.firmName
        };
        sessionStorage.setItem('user-form-data', JSON.stringify(userFormData));
      }
      
      grantAccess(formData.email, formData.fullName, formData.firmName);
      
      toast({
        title: "Welcome to Practical AI for Law Firms!",
        description: "You now have 48-hour access to the workshop replay."
      });
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async () => {
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/97l9HRK2FQf6v9i8xmYO/webhook-trigger/pilot-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactFormData,
          submittedAt: new Date().toISOString()
        })
      });
      
      // Redirect to Stripe
      window.location.href = `https://buy.stripe.com/aEU5n55qy2zScFycMN?prefilled_email=${encodeURIComponent(contactFormData.email)}`;
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  // Dynamically load booking widget script when modal is open
  useEffect(() => {
    if (showCalendarModal) {
      const script = document.createElement('script');
      script.src = 'https://link.legalfunnel.com/js/form_embed.js';
      script.type = 'text/javascript';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [showCalendarModal]);

  // Show booking widget popup after 30 seconds if not already open
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowCalendarModal((open) => open || true);
  //   }, 30000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Handle chatbot positioning to prevent footer overlap and align with video
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // If footer is approaching viewport, move chatbot up
        if (footerRect.top < viewportHeight - 400 - 16) {
          const overlapDistance = viewportHeight - footerRect.top;
          setChatbotPosition(`${overlapDistance + 16}px`);
        } else {
          setChatbotPosition('16px');
        }
      }
    };

    // Initial position and scroll listener
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        {/* <OfferBanner /> */}
        <div className="flex items-center justify-center p-4" style={{ minHeight: '100vh', paddingTop: '0px' }}>
          <Card className="w-full max-w-lg shadow-2xl border-0 rounded-xl">
          <CardHeader className="text-center pb-8">
            <img 
              src="https://mylegalacademy.com/wp-content/uploads/2024/02/6421617a227524146f1d195b_logo.webp" 
              alt="MyLegalAcademy Logo" 
              className="h-12 mx-auto mb-6"
            />
            <CardTitle className="text-3xl font-bold">
              <span className="text-black">Practical AI for Law Firms: Lead to Retainer — Watch the Workshop Replay Now</span>
            </CardTitle>
                <p className="text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                  Learn how <span className="font-semibold text-foreground">My Legal Academy</span> helps law firms implement AI-powered intake systems and digital teammates to convert leads into signed retainers faster. Discover the 11-stage blueprint that enables firms to respond to leads within 37 seconds and achieve higher conversion rates.
                </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={formErrors.fullName ? 'border-red-500' : ''}
                  placeholder="John Smith"
                />
                {formErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Work Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? 'border-red-500' : ''}
                  placeholder="john@lawfirm.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={formErrors.phone ? 'border-red-500' : ''}
                  placeholder="(555) 123-4567"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="firmName">Law Firm Name *</Label>
                <Input
                  id="firmName"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  className={formErrors.firmName ? 'border-red-500' : ''}
                  placeholder="Smith & Associates"
                />
                {formErrors.firmName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.firmName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="practiceArea">Practice Area *</Label>
                <Select
                  value={formData.practiceArea}
                  onValueChange={(value) => setFormData({ ...formData, practiceArea: value })}
                >
                  <SelectTrigger className={formErrors.practiceArea ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your practice area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal-injury">Personal Injury</SelectItem>
                    <SelectItem value="family-law">Family Law</SelectItem>
                    <SelectItem value="criminal-defense">Criminal Defense</SelectItem>
                    <SelectItem value="estate-planning">Estate Planning</SelectItem>
                    <SelectItem value="business-law">Business Law</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="immigration">Immigration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.practiceArea && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.practiceArea}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                variant="success"
                size="lg"
                className="w-full py-6 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Watch the Workshop Replay Now'}
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-3">
                ⚡ Instant access. No fluff. Real strategies you can apply to your firm today.
              </p>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Offer Banner */}
      {/* <OfferBanner onScheduleCall={() => setShowCalendarModal(true)} /> */}
      
      {/* Header */}
      <header className="fixed top-0 w-full bg-card shadow-md border-b border-border z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-center">
            <img 
              src="https://mylegalacademy.com/wp-content/uploads/2024/02/6421617a227524146f1d195b_logo.webp" 
              alt="MyLegalAcademy Logo" 
              className="h-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-8" style={{ paddingTop: '100px' }}>
        <div className="max-w-7xl mx-auto px-4">
          {/* Full Width Hero Section */}
          <div className="w-full mb-8 text-center">
            <h2 className="font-sans text-4xl md:text-5xl font-bold mb-2 text-black leading-[1.1] pb-2 w-full">Practical AI for Law Firms: Lead to Retainer Workshop — Watch the Replay</h2>
            
            <p className="text-xl text-muted-foreground mb-2 leading-relaxed md:leading-8">
              Discover the exact strategy, then claim your personalized roadmap to scale your law firm.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Video */}
            <div className="w-full lg:w-[65%] flex flex-col">
              {/* Video Section */}
              <div id="video-section" className="rounded-xl shadow-2xl overflow-hidden bg-card border border-border mb-8 w-full">
                <div style={{padding: '56.25% 0 0 0', position: 'relative'}}>
  <iframe
    src="https://player.vimeo.com/video/1122004006?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
    frameBorder="0"
    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    title="Practical Ai for Law Firms September 24,2025"
  />
</div>
                <script src="https://player.vimeo.com/api/player.js"></script>
              </div>
              
              <div className="w-full">
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed md:leading-8">
                  Discover how to implement AI-powered intake systems and digital teammates that respond to leads within 37 seconds. Learn the 11-stage blueprint used by successful law firms to convert leads into signed retainers faster and more efficiently using voice AI and chatbot systems.
                </p>
                
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed md:leading-8">
                  If you're a law firm owner or attorney ready to grow with a result-driven, proven process, this is your shortcut to scalable, predictable success. We handle all the complexity, so you can close more clients with less effort. This blueprint delivers results, not just promises.
                </p>
                
                <Button 
                  onClick={() => setShowCalendarModal(true)}
                  variant="success"
                  size="lg"
                  className="py-3 px-6 text-sm shadow-xl whitespace-nowrap w-full mt-4 transition-opacity duration-300"
                  data-left-button
                  style={{ opacity: leftButtonOpacity }}
                >
                  Schedule Your Free Strategy Session
                </Button>
              </div>
            </div>

            {/* Right Column: Chatbot */}
            <div className="w-full lg:w-[35%] flex flex-col lg:sticky lg:h-fit" style={{ top: '130px' }}>
              <div className="w-full">
                <ChatInterface userEmail={userAccess?.email || ''} />
              </div>
              <Button 
                onClick={() => setShowCalendarModal(true)}
                variant="success"
                size="lg"
                className="py-3 px-6 text-sm shadow-xl whitespace-nowrap w-full mt-4 transition-opacity duration-300"
                data-calendar-trigger
                data-right-button
                style={{ opacity: rightButtonOpacity }}
              >
                Schedule Your Free Facebook Strategy Session
              </Button>
            </div>
          </div>
        </div>
      </main>


      {/* Contact Form Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {contactStep === 1 ? 'Apply to Practical AI Implementation Program' : 
               contactStep === 2 ? 'Tell Us About Your Firm' : 
               'Complete Your Application'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step <= contactStep ? 'gradient-bg text-white' : 'bg-gray-200'
                }`}>
                  {step < contactStep ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 3 && <div className={`w-full h-1 mx-2 ${
                  step < contactStep ? 'gradient-bg' : 'bg-gray-200'
                }`} />}
              </div>
            ))}
          </div>
          
          {contactStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={contactFormData.firstName}
                    onChange={(e) => setContactFormData({ ...contactFormData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={contactFormData.lastName}
                    onChange={(e) => setContactFormData({ ...contactFormData, lastName: e.target.value })}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                  placeholder="john@lawfirm.com"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  value={contactFormData.phone}
                  onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <Button 
                onClick={() => setContactStep(2)}
                className="w-full gradient-bg"
                disabled={!contactFormData.firstName || !contactFormData.lastName || !contactFormData.email || !contactFormData.phone}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {contactStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Law Firm Name *</Label>
                <Input
                  value={contactFormData.firmName}
                  onChange={(e) => setContactFormData({ ...contactFormData, firmName: e.target.value })}
                  placeholder="Smith & Associates"
                />
              </div>
              <div>
                <Label>Practice Area *</Label>
                <Select
                  value={contactFormData.practiceArea}
                  onValueChange={(value) => setContactFormData({ ...contactFormData, practiceArea: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select practice area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal-injury">Personal Injury</SelectItem>
                    <SelectItem value="family-law">Family Law</SelectItem>
                    <SelectItem value="criminal-defense">Criminal Defense</SelectItem>
                    <SelectItem value="estate-planning">Estate Planning</SelectItem>
                    <SelectItem value="business-law">Business Law</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Firm Size *</Label>
                <Select
                  value={contactFormData.firmSize}
                  onValueChange={(value) => setContactFormData({ ...contactFormData, firmSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select firm size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo Practice</SelectItem>
                    <SelectItem value="2-5">2-5 Attorneys</SelectItem>
                    <SelectItem value="6-15">6-15 Attorneys</SelectItem>
                    <SelectItem value="16-50">16-50 Attorneys</SelectItem>
                    <SelectItem value="50+">50+ Attorneys</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => setContactStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setContactStep(3)}
                  className="flex-1 gradient-bg"
                  disabled={!contactFormData.firmName || !contactFormData.practiceArea || !contactFormData.firmSize}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {contactStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>What are your biggest challenges with client intake? *</Label>
                <textarea
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  value={contactFormData.message}
                  onChange={(e) => setContactFormData({ ...contactFormData, message: e.target.value })}
                  placeholder="Tell us about your current challenges..."
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">What happens next?</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• You'll be redirected to complete payment ($297/month)</li>
                  <li>• Receive immediate access to AI implementation platform</li>
                  <li>• Get your custom AI assistant within 48 hours</li>
                  <li>• Start converting more leads automatically</li>
                </ul>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => setContactStep(2)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleContactSubmit}
                  className="flex-1 gradient-bg"
                  disabled={!contactFormData.message}
                >
                  Complete Application <CreditCard className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calendar Modal */}
      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="w-[90vw] sm:w-[85vw] md:w-[80vw] lg:w-[75vw] xl:w-[70vw] max-w-4xl h-[85vh] sm:h-[80vh] md:h-[85vh] lg:h-[90vh] overflow-auto p-0 [&>button]:hidden flex flex-col">
          {/* Close button in top-right corner */}
          <button
            onClick={() => setShowCalendarModal(false)}
            className="absolute top-4 right-4 z-50 w-12 h-12 bg-white/95 hover:bg-white border-2 border-gray-300 hover:border-gray-400 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
            aria-label="Close calendar"
          >
            <span className="text-2xl font-bold text-gray-700">×</span>
          </button>
          {/* 
          <iframe
            src="https://link.legalfunnel.com/widget/booking/wHnizo5IIKApiDJQe28z"
            style={{ width: '100%', border: 'none', overflow: 'auto' }}
            scrolling="auto"
            id="wHnizo5IIKApiDJQe28z_1752003416752"
            className="rounded-lg flex-1"
          /> */}

          <iframe src="https://link.legalfunnel.com/widget/booking/Lisqw7g0brU5cOaTv5cS" 
          style={{ width: '100%', border: 'none', overflow: 'hidden' }}
          scrolling="no"
          id="Lisqw7g0brU5cOaTv5cS_1758829554941"
          className="rounded-lg flex-1"
          />
          
          {/* Close button at the bottom */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={() => setShowCalendarModal(false)}
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 font-medium transition-colors duration-200"
              aria-label="Close calendar"
            >
              Close ×
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Upgrade to Practical AI Pro</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={billingFrequency === 'monthly' ? 'default' : 'outline'}
              onClick={() => setBillingFrequency('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingFrequency === 'annual' ? 'default' : 'outline'}
              onClick={() => setBillingFrequency('annual')}
            >
              Annual (Save 20%)
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="gradient-border">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">
                  ${billingFrequency === 'monthly' ? '297' : '238'}/mo
                </div>
                {billingFrequency === 'annual' && (
                  <p className="text-sm text-gray-600">Billed annually</p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>AI-powered intake assistant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Unlimited conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Lead qualification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>CRM integration</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 gradient-bg">
                  Get Started
                </Button>
              </CardContent>
            </Card>
            
            <Card className="gradient-border relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold">
                  ${billingFrequency === 'monthly' ? '597' : '478'}/mo
                </div>
                {billingFrequency === 'annual' && (
                  <p className="text-sm text-gray-600">Billed annually</p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Multi-language support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Custom workflows</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 gradient-bg">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <img 
                src="https://mylegalacademy.com/wp-content/uploads/2024/02/6421617a227524146f1d195b_logo.webp" 
                alt="MyLegalAcademy Logo"
                className="h-8 mb-4"
              />
              <p className="text-gray-600">© 2025 My Legal Academy. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <a href="https://mylegalacademy.com/terms-of-service/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Terms of Service</a>
              <a href="https://mylegalacademy.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Masterclass;