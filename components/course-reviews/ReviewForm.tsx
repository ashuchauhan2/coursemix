import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter } from "bad-words"; // Import the profanity filter

interface ReviewFormProps {
  courseId: string;
  courseName: string;
}

interface Review {
  id: string;
  user_id: string;
  course_id: string;
  review: string;
  difficulty: string;
  created_at: string;
}

export default function ReviewForm({ courseId, courseName }: ReviewFormProps) {
  const [review, setReview] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Error message state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Current user ID

  // Filter states
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [filterSort, setFilterSort] = useState<string>(""); // "latest", "oldest", or ""
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");

  const profFilter = new Filter(); // Initialize the profanity filter

  useEffect(() => {
    async function fetchReviews() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("course_id", courseId);

      if (data) setReviews(data);
    }

    async function fetchCurrentUser() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    }

    fetchReviews();
    fetchCurrentUser();
  }, [courseId]);

  // Filter logic
  const filteredReviews = reviews
    .filter((review) => {
      const matchesKeyword = review.review
        .toLowerCase()
        .includes(filterKeyword.toLowerCase());
      const matchesDifficulty =
        !filterDifficulty || review.difficulty === filterDifficulty;
      return matchesKeyword && matchesDifficulty;
    })
    .sort((a, b) => {
      if (filterSort === "latest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (filterSort === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return 0;
    });

  const setTemporaryErrorMessage = (message: string, duration: number = 3000) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), duration);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!review.trim()) {
      setTemporaryErrorMessage("Your review cannot be empty. Please write something.");
      setIsSubmitting(false);
      return;
    }

    if (profFilter.isProfane(review)) {
      setTemporaryErrorMessage("Your review contains inappropriate content. Please revise it.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTemporaryErrorMessage("User not authenticated. Please log in.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        course_id: courseId,
        review,
        difficulty,
      });

    if (error) {
      setTemporaryErrorMessage("Failed to submit review. Please try again later.");
    } else {
      setReview("");
      setDifficulty("");
      // Fetch the updated reviews
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("course_id", courseId);
      if (data) setReviews(data);
    }

    setIsSubmitting(false);
  }

  const handleEdit = (reviewId: string, currentContent: string) => {
    setEditingReviewId(reviewId);
    setEditContent(currentContent);
  };

  const handleSave = async (reviewId: string) => {
    if (!editContent.trim()) {
      setTemporaryErrorMessage("Edited content cannot be empty.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("reviews")
      .update({ review: editContent })
      .eq("id", reviewId);

    if (error) {
      setTemporaryErrorMessage("Failed to update the review. Please try again later.");
    } else {
      setEditingReviewId(null);
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("course_id", courseId);
      if (data) setReviews(data);
    }
  };

  const handleCancel = () => {
    setEditingReviewId(null);
    setEditContent("");
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setTemporaryErrorMessage("Review copied to clipboard!");
  };

  const handleDelete = async (reviewId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this review?");
    if (!confirmDelete) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      setTemporaryErrorMessage("Failed to delete the review. Please try again later.");
    } else {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("course_id", courseId);
      if (data) setReviews(data);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500 hover:bg-green-600";
      case "Medium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Hard":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilterKeyword("");
    setFilterSort("");
    setFilterDifficulty("");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Reviews for {courseName}
        </h3>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 border-l-4 border-red-600 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Filtered Reviews */}
        {filteredReviews.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No reviews match the filters.</p>
        ) : (
          <ul className="space-y-2">
            {filteredReviews.map((r) => (
              <li
                key={r.id}
                className="p-3 rounded-xl mt-1 flex justify-between items-center bg-gray-100 dark:bg-gray-800"
              >
                {editingReviewId === r.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-xl"
                    />
                    <Button
                      onClick={() => handleSave(r.id)}
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
                  <>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">{r.review}</p>
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${getDifficultyColor(
                          r.difficulty
                        )}`}
                      >
                        Difficulty: {r.difficulty}
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setDropdownOpen(dropdownOpen === r.id ? null : r.id)
                        }
                        className="p-1 text-gray-600 dark:text-gray-300 hover:text-black focus:outline-none"
                        aria-label="Options"
                      >
                        <span className="text-lg font-bold">⋮</span>
                      </button>

                      {dropdownOpen === r.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 shadow-lg rounded-xl z-10 border dark:border-gray-700 overflow-hidden">
                          {r.user_id === currentUserId && (
                            <>
                              <button
                                onClick={() => handleEdit(r.id, r.review)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-800 rounded-xl"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleCopy(r.review)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit}>
          <Input
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write a review..."
            className="mt-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          <div className="mt-4 space-x-2">
            {["Easy", "Medium", "Hard"].map((level) => (
              <Button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`${
                  difficulty === level
                    ? getDifficultyColor(level)
                    : "bg-gray-300 dark:bg-gray-600"
                } text-white`}
              >
                {level}
              </Button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !difficulty}
            className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white mt-6 font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Submit Review
          </Button>
        </form>
      </div>

      {/* Filter Sidebar */}
      <div className="h-full bg-gray-100 dark:bg-gray-900 p-4 rounded-lg shadow-md">
        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Filters
        </h4>

        {/* Keyword Filter */}
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

        {/* Difficulty Filter */}
        <div className="mb-4">
          <label
            htmlFor="difficulty-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Difficulty
          </label>
          <select
            id="difficulty-filter"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="mb-4">
          <label
            htmlFor="sort-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Sort By
          </label>
          <select
            id="sort-filter"
            value={filterSort}
            onChange={(e) => setFilterSort(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">None</option>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {/* Clear Filters Button */}
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
