import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  userEmail?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userEmail }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Ava, your AI assistant trained on My Legal Academy\'s \'Practical AI for Law Firms: Lead to Retainer\' workshop. Ask me anything about AI-powered intake systems, digital teammates, and the 11-stage blueprint!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [userInteractionCount, setUserInteractionCount] = useState(0);
  const [showStarterQuestions, setShowStarterQuestions] = useState(true);
  const [isFromFacebook, setIsFromFacebook] = useState(false);
  const [collectingInfo, setCollectingInfo] = useState(false);
  const [infoStep, setInfoStep] = useState<'full_name' | 'email' | 'phone' | 'law_firm_name' | 'practice_type' | 'complete'>('full_name');
  const [currentUserEmail, setCurrentUserEmail] = useState(userEmail);
  const [pendingInfoPrompt, setPendingInfoPrompt] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check for Facebook traffic and initialize info collection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    
    if (source === 'fb') {
      setIsFromFacebook(true);
      
      // Check if user info already exists in session
      const existingInfo = JSON.parse(sessionStorage.getItem('fbUserInfo') || '{}');
      const requiredFields = ['full_name', 'email', 'phone', 'law_firm_name', 'practice_type'];
      const missingFields = requiredFields.filter(field => !existingInfo[field]);
      
      // Info collection will be triggered after 3-4 interactions, not immediately
      if (missingFields.length === 0) {
        // All info already collected, show suggested questions
        setShowStarterQuestions(true);
      }
    }
  }, []);

  // Check for pending info prompt after chat response
  useEffect(() => {
    if (pendingInfoPrompt && !isLoading) {
      setTimeout(() => {
        const infoMessage: Message = {
          id: 'info_collection_' + Date.now(),
          role: 'assistant',
          content: pendingInfoPrompt,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, infoMessage]);
        setPendingInfoPrompt(null);
      }, 1000);
    }
  }, [pendingInfoPrompt, isLoading]);

  // Trigger Facebook info collection after 3 interactions (but delay until after chat response)
  useEffect(() => {
    if (isFromFacebook && userInteractionCount >= 3 && !collectingInfo && !pendingInfoPrompt) {
      const existingInfo = JSON.parse(sessionStorage.getItem('fbUserInfo') || '{}');
      const requiredFields = ['full_name', 'email', 'phone', 'law_firm_name', 'practice_type'];
      const missingFields = requiredFields.filter(field => !existingInfo[field]);
      
      if (missingFields.length > 0) {
        setCollectingInfo(true);
        setShowStarterQuestions(false);
        setInfoStep(missingFields[0] as any);
        
        // Set up prompts for each field
        const prompts = {
          full_name: 'By the way, I\'d love to personalize our conversation. What\'s your name?',
          email: 'Great! And what\'s the best email to reach you at?',
          phone: 'Perfect. Mind sharing your phone number?',
          law_firm_name: 'What\'s the name of your law firm?',
          practice_type: 'What is your practice type?'
        };
        
        // Set the pending prompt instead of immediately showing it
        setPendingInfoPrompt(prompts[missingFields[0] as keyof typeof prompts]);
      }
    }
  }, [userInteractionCount, isFromFacebook, collectingInfo, pendingInfoPrompt]);

  // Auto-scroll to latest message with smooth animation
  useEffect(() => {
    if (messagesContainerRef.current) {
      // For better UX, scroll to show the top of the latest message
      const container = messagesContainerRef.current;
      const lastMessage = container.lastElementChild;
      
      if (lastMessage) {
        lastMessage.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }
  }, [messages, isLoading]);

  // Format text to make content within quotes or asterisks bold
  const formatMessageContent = (content: string) => {
    // Split by quotes and asterisks patterns, keeping delimiters
    const parts = content.split(/(".*?"|\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      // Check if part is within quotes
      if (part.startsWith('"') && part.endsWith('"')) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      // Check if part is within asterisks
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      // Return normal text
      return part;
    });
  };

  const starterQuestions = [
    "How do digital teammates respond to leads within 37 seconds?",
    "What is the 11-stage intake blueprint that converts leads to retainers?",
    "How can AI help my law firm capture and qualify leads automatically?"
  ];

  const predefinedResponses: { [key: string]: string } = {
    "How do digital teammates respond to leads within 37 seconds?": "Digital teammates are AI-powered systems that instantly capture leads and make contact within 37 seconds. They use voice AI (like 'Joe' demonstrated in the workshop) or chatbot systems to call new leads automatically, qualify them with custom questions, and schedule appointments on your calendar. This speed is critical because Harvard Business Review research shows you lose 80% of leads if you wait even 1 minute to respond!",
    "What is the 11-stage intake blueprint that converts leads to retainers?": "The 11-stage blueprint covers: 1) Lead Capture, 2) Initial Contact (37 seconds), 3) Lead Qualification, 4) Appointment Scheduling, 5) Appointment Confirmation, 6) Document Collection, 7) Pre-Consultation Preparation, 8) Human Consultation, 9) Follow-up & Nurture, 10) Retainer Preparation & Signing, 11) Case Management Integration. This system ensures no lead falls through the cracks and maximizes conversion rates.",
    "How can AI help my law firm capture and qualify leads automatically?": "AI systems work 24/7 across all channels - your website, Instagram, WhatsApp, Facebook Messenger. They automatically qualify prospects using custom questions specific to your practice area (PI, immigration, estate planning, etc.), collect documents before appointments, and prepare human staff with case summaries. This works for any practice area and integrates with existing CRMs like Lawmatics, HubSpot, or Legal Funnel."
  };

  const handleStarterQuestion = (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: predefinedResponses[question],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setShowStarterQuestions(false);
    setUserInteractionCount(prev => prev + 1);

    // Track the question
    fetch('https://uavilthuyclqjnxgjmwr.supabase.co/functions/v1/increment-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    }).catch(error => {
      console.error('Failed to track question:', error);
    });
  };

  // Handle Facebook user info collection
  const handleInfoCollection = (userInput: string) => {
    const currentInfo = JSON.parse(sessionStorage.getItem('fbUserInfo') || '{}');
    
    // Store current field
    currentInfo[infoStep] = userInput;
    currentInfo.source = 'fb';
    sessionStorage.setItem('fbUserInfo', JSON.stringify(currentInfo));

    // If email was just collected, update the current user email for display
    if (infoStep === 'email') {
      setCurrentUserEmail(userInput);
    }

    // Define the flow order and next prompts
    const flowOrder = ['full_name', 'email', 'phone', 'law_firm_name', 'practice_type'];
    const nextPrompts = {
      full_name: 'Great! And what\'s the best email to reach you at?',
      email: 'Perfect. Mind sharing your phone number?',
      phone: 'What\'s the name of your law firm?',
      law_firm_name: 'What is your practice type?',
      practice_type: 'Perfect! Thanks for that. Now, what would you like to know about the masterclass?'
    };

    const currentIndex = flowOrder.indexOf(infoStep);
    const nextStep = flowOrder[currentIndex + 1];

    if (nextStep) {
      setInfoStep(nextStep as any);
      
      const nextMessage: Message = {
        id: `info_${nextStep}_` + Date.now(),
        role: 'assistant',
        content: nextPrompts[infoStep as keyof typeof nextPrompts],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, nextMessage]);
    } else {
      // All info collected - now submit complete payload
      setInfoStep('complete');
      setCollectingInfo(false);
      
      // Check if all required fields are present
      const requiredFields = ['full_name', 'email', 'phone', 'law_firm_name', 'practice_type'];
      const allFieldsPresent = requiredFields.every(field => currentInfo[field]);
      
      if (allFieldsPresent) {
        // Save complete data to backend and send to webhook
        saveUserInfo(currentInfo);
        
        const thankYouMessage: Message = {
          id: 'info_complete_' + Date.now(),
          role: 'assistant',
          content: 'Perfect! Thanks for that. Now, what would you like to know about the masterclass?',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, thankYouMessage]);
        
        // Show suggested questions after info collection is complete
        setTimeout(() => {
          setShowStarterQuestions(true);
        }, 1500);
      } else {
        console.error('Missing required fields:', requiredFields.filter(field => !currentInfo[field]));
      }
    }
  };

  // Save user info to backend and webhook
  const saveUserInfo = async (userInfo: any) => {
    try {
      // Prepare webhook payload with new field names
      const webhookPayload = {
        full_name: userInfo.full_name,
        email: userInfo.email,
        phone: userInfo.phone,
        law_firm_name: userInfo.law_firm_name,
        practice_type: userInfo.practice_type,
        source: 'fb'
      };

      console.log('Sending to webhook:', webhookPayload);

      // Send to webhook via edge function with proper URL
      const response = await fetch('https://uavilthuyclqjnxgjmwr.supabase.co/functions/v1/submit-form-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdmlsdGh1eWNscWpueGdqbXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDgzOTcsImV4cCI6MjA2NjI4NDM5N30.FsYH0fD1pCG_z1S9dgCkQ8xoiQ4boXlpc48D8k0XeZk`,
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        console.error('Webhook response error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Webhook error details:', errorText);
        throw new Error(`Webhook failed: ${response.status}`);
      }

      const responseData = await response.text();
      console.log('Webhook sent successfully:', responseData);

      // Save to backend database - create or update user profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userInfo.email)
        .maybeSingle();

      if (existingProfile) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: userInfo.full_name,
            phone: userInfo.phone,
            source: userInfo.source,
            updated_at: new Date().toISOString()
          })
          .eq('email', userInfo.email);

        if (updateError) {
          console.error('Failed to update user profile:', updateError);
        } else {
          console.log('User profile updated successfully');
        }
      } else {
        // Create new user profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            name: userInfo.full_name,
            email: userInfo.email,
            phone: userInfo.phone,
            source: userInfo.source
          });

        if (insertError) {
          console.error('Failed to create user profile:', insertError);
        } else {
          console.log('User profile created successfully');
        }
      }

      toast({
        title: "Info Saved",
        description: "Your information has been saved successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to save user info:', error);
    }
  };

  const handleScheduleCall = () => {
    // Find the calendar modal trigger and click it
    const calendarButton = document.querySelector('[data-calendar-trigger]') as HTMLButtonElement;
    if (calendarButton) {
      calendarButton.click();
    } else {
      // Fallback: scroll to the button
      const scheduleButton = document.querySelector('button[variant="success"]') as HTMLElement;
      if (scheduleButton) {
        scheduleButton.scrollIntoView({ behavior: 'smooth' });
        scheduleButton.click();
      }
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Handle Facebook info collection first
    if (isFromFacebook && collectingInfo) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Process the info collection
      handleInfoCollection(inputMessage);
      return;
    }

    // Track popular question
    fetch('https://uavilthuyclqjnxgjmwr.supabase.co/functions/v1/increment-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: inputMessage }),
    }).catch(error => {
      console.error('Failed to track question:', error);
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowStarterQuestions(false);
    setUserInteractionCount(prev => prev + 1);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: inputMessage,
          sessionId: sessionId,
          userEmail: currentUserEmail || userEmail || 'anonymous@example.com'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Send webhook after exactly 5 questions completed by chatbot
      if (userInteractionCount === 5) {
        try {
          // Get any available user info
          const fbUserInfo = JSON.parse(sessionStorage.getItem('fbUserInfo') || '{}');
          const webhookPayload = {
            full_name: fbUserInfo.full_name || '',
            email: fbUserInfo.email || currentUserEmail || userEmail || '',
            phone: fbUserInfo.phone || '',
            law_firm_name: fbUserInfo.law_firm_name || '',
            practice_type: fbUserInfo.practice_type || '',
            source: isFromFacebook ? 'fb' : 'web',
            trigger: '5_questions_completed'
          };

          console.log('Sending 5-question webhook:', webhookPayload);

          // Send to webhook via edge function
          fetch('https://uavilthuyclqjnxgjmwr.supabase.co/functions/v1/submit-form-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdmlsdGh1eWNscWpueGdqbXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDgzOTcsImV4cCI6MjA2NjI4NDM5N30.FsYH0fD1pCG_z1S9dgCkQ8xoiQ4boXlpc48D8k0XeZk`,
            },
            body: JSON.stringify(webhookPayload),
          }).catch(error => {
            console.error('Failed to send 5-question webhook:', error);
          });
        } catch (error) {
          console.error('Error preparing 5-question webhook:', error);
        }
      }

      // After responding to user, trigger info collection if needed for Facebook users
      if (isFromFacebook && userInteractionCount >= 3 && !collectingInfo) {
        const existingInfo = JSON.parse(sessionStorage.getItem('fbUserInfo') || '{}');
        const requiredFields = ['full_name', 'email', 'phone', 'law_firm_name', 'practice_type'];
        const missingFields = requiredFields.filter(field => !existingInfo[field]);
        
        if (missingFields.length > 0) {
          setCollectingInfo(true);
          setShowStarterQuestions(false);
          setInfoStep(missingFields[0] as any);
          
          const prompts = {
            full_name: 'By the way, I\'d love to personalize our conversation. What\'s your name?',
            email: 'Great! And what\'s the best email to reach you at?',
            phone: 'Perfect. Mind sharing your phone number?',
            law_firm_name: 'What\'s the name of your law firm?',
            practice_type: 'What is your practice type?'
          };
          
          setTimeout(() => {
            const infoMessage: Message = {
              id: 'info_collection_' + Date.now(),
              role: 'assistant',
              content: prompts[missingFields[0] as keyof typeof prompts],
              timestamp: new Date()
            };
            setMessages(prev => [...prev, infoMessage]);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[600px] flex flex-col p-2">
      <Card className="flex flex-col h-full bg-white border border-gray-200 shadow-lg">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Got questions from the webinar?
          </CardTitle>
          <p className="text-sm text-gray-600">
            Ava (AI assistant) is trained on the full session—ask anything and get instant answers.
          </p>
          {currentUserEmail && !isFromFacebook && (
            <p className="text-xs text-blue-600">
              Logged in as: {currentUserEmail}
            </p>
          )}
          {isFromFacebook && currentUserEmail && currentUserEmail !== userEmail && (
            <p className="text-xs text-blue-600">
              Logged in as: {currentUserEmail}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <div
            ref={messagesContainerRef}
            data-lov-id="src\\components\\ChatInterface.tsx:111:4"
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-smooth"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    px-4 py-3 rounded-2xl shadow mx-1
                    ${message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white self-end'
                      : 'bg-white border border-gray-200 text-gray-900 self-start'}
                    max-w-[85%] w-auto
                    whitespace-pre-line
                    break-words
                    overflow-wrap-anywhere
                    word-wrap-break-word
                  `}
                >
                  <p className="text-sm leading-relaxed">{formatMessageContent(message.content)}</p>
                </div>
              </div>
            ))}

            {/* Starter Questions - Hidden during Facebook info collection */}
            {showStarterQuestions && !collectingInfo && (
              <div className="mb-4 flex justify-start">
                <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow mx-1 max-w-[95%] w-auto">
                  <p className="text-sm text-gray-600 mb-3">Here are some popular questions about the workshop:</p>
                  <div className="space-y-2">
                    {starterQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleStarterQuestion(question)}
                        className="w-full text-left p-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 cursor-pointer"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CTA Suggestion - Show after every 2 user interactions */}
            {userInteractionCount > 0 && userInteractionCount % 2 === 0 && (
              <div className="mb-4 flex justify-start">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4 rounded-2xl shadow mx-1 max-w-[85%] w-auto">
                  <button
                    onClick={handleScheduleCall}
                    className="w-full text-left text-sm font-bold text-green-700 hover:text-green-800 transition-colors duration-200 cursor-pointer"
                  >
                    👉 Schedule Your Free Facebook Strategy Session
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="mb-4 flex justify-start">
                <div className="inline-block bg-white border border-gray-200 p-3 rounded-2xl shadow text-sm text-gray-500 mx-1 max-w-[85%] w-auto">
                  Ava is typing...
                </div>
              </div>
            )}
          </div>
          <div
            data-lov-id="src\\components\\ChatInterface.tsx:126:6"
            className="mt-2 flex-shrink-0"
          >
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the workshop content..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
