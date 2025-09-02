import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Heart, Users, ArrowRight, LogOut } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, userProfile, signOut, loading } = useAuth();

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.user_type === 'donor') {
        navigate('/donor');
      } else if (userProfile.user_type === 'receiver') {
        navigate('/receiver');
      }
    }
  }, [user, userProfile, navigate]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Book Redistribution</h1>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {userProfile?.full_name || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Connecting Books with Those Who Need Them
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A platform where generous donors share books freely with those who need them most. 
              Join our community of book lovers making education accessible to everyone.
            </p>
          </div>

          {!user ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
                <Card>
                  <CardHeader>
                    <Heart className="h-8 w-8 text-primary mx-auto" />
                    <CardTitle>Donate Books</CardTitle>
                    <CardDescription>
                      Share your books with those who need them most
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <BookOpen className="h-8 w-8 text-primary mx-auto" />
                    <CardTitle>Find Books</CardTitle>
                    <CardDescription>
                      Discover free books from generous donors
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <Users className="h-8 w-8 text-primary mx-auto" />
                    <CardTitle>Build Community</CardTitle>
                    <CardDescription>
                      Connect with like-minded book lovers
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Welcome back!</CardTitle>
                  <CardDescription>
                    You're logged in as a {userProfile?.user_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {userProfile?.user_type === 'donor' ? (
                      <Button onClick={() => navigate('/donor')} className="flex-1">
                        Go to Donor Dashboard
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/receiver')} className="flex-1">
                        Browse Books
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
