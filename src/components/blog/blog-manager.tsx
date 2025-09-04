"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "./post-card";
import { PostForm } from "./post-form";
import { Plus, Search, RefreshCw } from "lucide-react";

interface User {
  id: string;
  name?: string;
  email: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content?: string;
  published: boolean;
  createdAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
  };
}

export function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsResponse, usersResponse] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/users"),
      ]);

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePost = async (postData: any) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
      } else {
        console.error("Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePost = async (postData: any) => {
    if (!editingPost) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        await fetchData();
        setEditingPost(null);
      } else {
        console.error("Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
      } else {
        console.error("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm || editingPost) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {editingPost ? "Edit Post" : "Create New Post"}
            </h2>
            <p className="text-muted-foreground">
              {editingPost ? "Update your post content" : "Share your thoughts with the community"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setEditingPost(null);
            }}
          >
            Back to Posts
          </Button>
        </div>
        <PostForm
          post={editingPost ? {
            id: editingPost.id,
            title: editingPost.title,
            content: editingPost.content,
            published: editingPost.published,
            authorId: editingPost.author.id,
          } : undefined}
          users={users}
          onSave={editingPost ? handleUpdatePost : handleCreatePost}
          onCancel={() => {
            setShowForm(false);
            setEditingPost(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Blog Posts</h2>
          <p className="text-muted-foreground">
            Manage your blog content and publications
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowForm(true)}
            disabled={actionLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading || actionLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No posts found matching your search." : "No posts yet."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={setEditingPost}
              onDelete={handleDeletePost}
              canEdit={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}