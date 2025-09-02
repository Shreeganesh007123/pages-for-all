import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Book, Trash2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DonorDashboard() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    subject_genre: '',
    edition: '',
    publisher: '',
    description: '',
    book_id: ''
  });

  useEffect(() => {
    if (userProfile) {
      fetchBooks();
      fetchRequests();
    }
  }, [userProfile]);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('donor_id', userProfile.id)
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

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('book_requests')
      .select(`
        *,
        books(title, author),
        profiles!book_requests_receiver_id_fkey(full_name, email, phone)
      `)
      .eq('donor_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch requests"
      });
    } else {
      setRequests(data || []);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('books')
      .insert({
        ...newBook,
        donor_id: userProfile.id,
        book_id: newBook.book_id || `BOOK_${Date.now()}`
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add book"
      });
    } else {
      toast({
        title: "Success",
        description: "Book added successfully"
      });
      setNewBook({
        title: '',
        author: '',
        subject_genre: '',
        edition: '',
        publisher: '',
        description: '',
        book_id: ''
      });
      setIsAddBookOpen(false);
      fetchBooks();
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete book"
      });
    } else {
      toast({
        title: "Success",
        description: "Book deleted successfully"
      });
      fetchBooks();
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('book_requests')
      .update({ status: action })
      .eq('id', requestId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} request`
      });
    } else {
      toast({
        title: "Success",
        description: `Request ${action} successfully`
      });
      fetchRequests();
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Donor Dashboard</h1>
          <p className="text-muted-foreground">Manage your donated books and requests</p>
        </div>
        <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Fill in the details of the book you want to donate
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="book-id">Book ID (Optional)</Label>
                <Input
                  id="book-id"
                  value={newBook.book_id}
                  onChange={(e) => setNewBook({...newBook, book_id: e.target.value})}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject/Genre</Label>
                <Input
                  id="subject"
                  value={newBook.subject_genre}
                  onChange={(e) => setNewBook({...newBook, subject_genre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edition">Edition</Label>
                <Input
                  id="edition"
                  value={newBook.edition}
                  onChange={(e) => setNewBook({...newBook, edition: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={newBook.publisher}
                  onChange={(e) => setNewBook({...newBook, publisher: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">Add Book</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Book Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Book Requests
            </CardTitle>
            <CardDescription>
              People who want to receive your books
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{request.books.title}</h4>
                    <p className="text-sm text-muted-foreground">by {request.books.author}</p>
                    <p className="text-sm"><strong>Requested by:</strong> {request.profiles.full_name}</p>
                    <p className="text-sm"><strong>Email:</strong> {request.profiles.email}</p>
                    {request.profiles.phone && (
                      <p className="text-sm"><strong>Phone:</strong> {request.profiles.phone}</p>
                    )}
                    {request.message && (
                      <p className="text-sm mt-2"><strong>Message:</strong> {request.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      request.status === 'pending' ? 'secondary' :
                      request.status === 'approved' ? 'default' : 'destructive'
                    }>
                      {request.status}
                    </Badge>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRequestAction(request.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestAction(request.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book: any) => (
          <Card key={book.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  <CardDescription>by {book.author}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBook(book.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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
                <div className="flex items-center gap-2 pt-2">
                  <Book className="h-4 w-4" />
                  <span className="text-sm font-mono">{book.book_id}</span>
                  <Badge variant={book.is_available ? "default" : "secondary"}>
                    {book.is_available ? "Available" : "Not Available"}
                  </Badge>
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
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No books match your search criteria." : "You haven't added any books yet."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddBookOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Book
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}