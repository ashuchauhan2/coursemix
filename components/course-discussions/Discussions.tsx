import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter } from "bad-words";

interface DiscussionsProps {
  courseId: string;
  courseName: string;
}

interface Post {
  id: string;
  user_id: string;
  course_id: string;
  content: string;
  created_at: string;
  first_name: string;
  last_name: string;
}

export default function Discussions({ courseId, courseName }: DiscussionsProps) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterTime, setFilterTime] = useState<string>("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const profFilter = new Filter();

  async function fetchPosts() {
    const { data: discussionsData, error: discussionsError } = await supabase
      .from("discussions")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (discussionsError) {
      setErrorMessage("Failed to fetch discussions. Please try again later.");
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name");

    if (profilesError) {
      setErrorMessage("Failed to fetch user profiles. Please try again later.");
      return;
    }

    const combinedPosts = discussionsData.map((post: any) => {
      const userProfile = profilesData.find(
        (profile) => profile.user_id === post.user_id
      );
      return {
        ...post,
        first_name: userProfile?.first_name || "Unknown",
        last_name: userProfile?.last_name || "User",
      };
    });

    setPosts(combinedPosts);
  }

  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    }

    getCurrentUser();
    fetchPosts();
  }, [courseId]);

  const filteredPosts = posts.filter((post) => {
    const postDate = new Date(post.created_at).toISOString().split("T")[0];
    const matchesKeyword = post.content
      .toLowerCase()
      .includes(filterKeyword.toLowerCase());
    const matchesDate = !filterStartDate || postDate === filterStartDate;
    const matchesTime =
      !filterTime || new Date(post.created_at).toTimeString().startsWith(filterTime);
    return matchesKeyword && matchesDate && matchesTime;
  });

  const clearFilters = () => {
    setFilterKeyword("");
    setFilterStartDate("");
    setFilterTime("");
  };

  const setTemporaryErrorMessage = (message: string, duration: number = 3000) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), duration);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!newPost.trim()) {
      setTemporaryErrorMessage("Your post cannot be empty. Please write something.");
      setIsSubmitting(false);
      return;
    }

    if (profFilter.isProfane(newPost)) {
      setTemporaryErrorMessage("Your post contains inappropriate content. Please revise it.");
      setIsSubmitting(false);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      setTemporaryErrorMessage("User not authenticated. Please log in.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("discussions")
      .insert({
        user_id: data.user.id,
        course_id: courseId,
        content: newPost,
      });

    if (error) {
      setTemporaryErrorMessage("Failed to post discussion. Please try again later.");
    } else {
      setNewPost("");
      fetchPosts();
    }

    setIsSubmitting(false);
  }

  const handleEdit = (postId: string, currentContent: string) => {
    setEditingPostId(postId);
    setEditContent(currentContent);
  };

  const handleSave = async (postId: string) => {
    if (!editContent.trim()) {
      setErrorMessage("Edited content cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("discussions")
      .update({ content: editContent })
      .eq("id", postId);

    if (error) {
      setErrorMessage("Failed to update the post. Please try again later.");
    } else {
      setEditingPostId(null);
      fetchPosts();
    }
  };

  const handleCancel = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setErrorMessage("Message copied to clipboard!");
    setTimeout(() => setErrorMessage(null), 2000);
  };

  const handleDelete = async (postId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("discussions")
      .delete()
      .eq("id", postId);

    if (error) {
      setTemporaryErrorMessage("Failed to delete the post. Please try again later.");
    } else {
      fetchPosts();
    }
  };

  return (
    <div className="flex flex-col  md:flex-row gap-6">
      <div className="flex-1 rounded-lg shadow-sm p-4 bg-gray-100 dark:bg-gray-900 transition-all hover:shadow-md group">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Discussions for {courseName}
        </h3>

        {errorMessage && (
          <div className="mb-4 p-3 border-l-4 border-red-600 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="flex flex-col items-start">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-black dark:text-gray-100">
                  {post.first_name} {post.last_name}
                </span>
                <span className="text-sm text-black dark:text-gray-400">
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>

              {editingPostId === post.id ? (
                <div className="flex items-center gap-2 w-full mt-2">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-xl"
                  />
                  <Button
                    onClick={() => handleSave(post.id)}
                    className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 rounded-xl"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-800 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div
                  className={`p-3 rounded-xl mt-1 flex justify-between items-center ${
                    post.user_id === currentUserId
                      ? "bg-teal-700 dark:bg-teal-800"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <p className="text-black dark:text-gray-300 flex-1">{post.content}</p>
                  {post.user_id === currentUserId && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setDropdownOpen(dropdownOpen === post.id ? null : post.id)
                        }
                        className="p-1 text-white dark:text-gray-300 hover:text-black focus:outline-none"
                        aria-label="Options"
                      >
                        <span className="text-lg font-bold">⋮</span>
                      </button>

                      {dropdownOpen === post.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 shadow-lg rounded-xl z-10 border dark:border-gray-700 overflow-hidden">
                          <button
                            onClick={() => handleEdit(post.id, post.content)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCopy(post.content)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-800 rounded-xl"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <Input
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write a discussion post..."
            className="mt-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white mt-6 font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Post
          </Button>
        </form>
      </div>

      <div className="w-64 h-full md:w-64 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Filters
        </h3>

        <div className="mb-4">
          <label
            htmlFor="keyword-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Keyword
          </label>
          <Input
            id="keyword-filter"
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            placeholder="Search by keyword..."
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Date
          </label>
          <Input
            id="start-date"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="time-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Time
          </label>
          <Input
            id="time-filter"
            type="time"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <Button
          onClick={clearFilters}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md w-full"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
