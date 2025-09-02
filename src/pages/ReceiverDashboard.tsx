import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Book, Filter, Heart, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReceiverDashboard() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  useEffect(() => {
    fetchBooks();
    if (userProfile) {
      fetchMyRequests();
    }
  }, [userProfile]);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        profiles!books_donor_id_fkey(full_name, email)
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch books"
      });
    } else {
      setBooks(data || []);
    }
  };

  const fetchMyRequests = async () => {
    const { data, error } = await supabase
      .from('book_requests')
      .select(`
        *,
        books(title, author),
        profiles!book_requests_donor_id_fkey(full_name, email, phone)
      `)
      .eq('receiver_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch requests"
      });
    } else {
      setMyRequests(data || []);
    }
  };

  const handleRequestBook = async () => {
    if (!selectedBook || !userProfile) return;

    const { error } = await supabase
      .from('book_requests')
      .insert({
        book_id: selectedBook.id,
        receiver_id: userProfile.id,
        donor_id: selectedBook.donor_id,
        message: requestMessage
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Already Requested",
          description: "You have already requested this book"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to request book"
        });
      }
    } else {
      toast({
        title: "Request Sent",
        description: "Your book request has been sent to the donor"
      });
      setRequestMessage('');
      setIsRequestDialogOpen(false);
      fetchMyRequests();
    }
  };

  const uniqueGenres = [...new Set(books.map(book => book.subject_genre).filter(Boolean))];

  const filteredBooks = books.filter(book => {
    const matchesSearch = searchTerm === '' || 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = genreFilter === '' || book.subject_genre === genreFilter;
    
    return matchesSearch && matchesGenre;
  });

  const hasRequestedBook = (bookId: string) => {
    return myRequests.some(request => request.book_id === bookId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Books</h1>
        <p className="text-muted-foreground">Discover books available for free from generous donors</p>
      </div>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              My Requests
            </CardTitle>
            <CardDescription>
              Track the status of your book requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myRequests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{request.books.title}</h4>
                    <p className="text-sm text-muted-foreground">by {request.books.author}</p>
                    <p className="text-sm"><strong>Donor:</strong> {request.profiles.full_name}</p>
                    {request.status === 'approved' && (
                      <>
                        <p className="text-sm"><strong>Email:</strong> {request.profiles.email}</p>
                        {request.profiles.phone && (
                          <p className="text-sm"><strong>Phone:</strong> {request.profiles.phone}</p>
                        )}
                      </>
                    )}
                  </div>
                  <Badge variant={
                    request.status === 'pending' ? 'secondary' :
                    request.status === 'approved' ? 'default' : 'destructive'
                  }>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books by title, author, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Genres</SelectItem>
              {uniqueGenres.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book: any) => (
          <Card key={book.id}>
            <CardHeader>
              <CardTitle className="text-lg">{book.title}</CardTitle>
              <CardDescription>by {book.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {book.subject_genre && (
                  <p className="text-sm"><strong>Genre:</strong> {book.subject_genre}</p>
                )}
                {book.edition && (
                  <p className="text-sm"><strong>Edition:</strong> {book.edition}</p>
                )}
                {book.publisher && (
                  <p className="text-sm"><strong>Publisher:</strong> {book.publisher}</p>
                )}
                {book.description && (
                  <p className="text-sm text-muted-foreground">{book.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  <span className="text-sm font-mono">{book.book_id}</span>
                </div>
                <p className="text-sm"><strong>Donor:</strong> {book.profiles.full_name}</p>
                
                <div className="pt-3">
                  {hasRequestedBook(book.id) ? (
                    <Button disabled className="w-full">
                      <Heart className="h-4 w-4 mr-2" />
                      Already Requested
                    </Button>
                  ) : (
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={() => setSelectedBook(book)}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Request Book
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Book</DialogTitle>
                          <DialogDescription>
                            Send a request to the donor for "{selectedBook?.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="message">Message to Donor (Optional)</Label>
                            <Textarea
                              id="message"
                              placeholder="Tell the donor why you need this book..."
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleRequestBook} className="flex-1">
                              Send Request
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsRequestDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No books found</h3>
            <p className="text-muted-foreground">
              {searchTerm || genreFilter ? "No books match your search criteria." : "No books are currently available."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}