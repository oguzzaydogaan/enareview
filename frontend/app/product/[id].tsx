import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { productService } from "../../services/productService";
import { reviewService } from "../../services/reviewService";

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [newReviewText, setNewReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);

  const fetchProductAndReviews = async () => {
    try {
      const productId = Number(id);
      const [productRes, reviewRes] = await Promise.all([
        productService.getProductById(productId),
        reviewService.getReviews(productId),
      ]);
      setProduct(productRes.data);
      setReviews(reviewRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  const handleToggleLike = async () => {
    try {
      const response = await productService.toggleLike(Number(id));
      setProduct((prev: any) => ({
        ...prev,
        likeCount: response.data.likeCount,
        dislikeCount: response.data.dislikeCount,
      }));
    } catch (error) {
      Alert.alert("Error", "Could not like product.");
    }
  };

  const handleToggleDislike = async () => {
    try {
      const response = await productService.toggleDislike(Number(id));
      setProduct((prev: any) => ({
        ...prev,
        likeCount: response.data.likeCount,
        dislikeCount: response.data.dislikeCount,
      }));
    } catch (error) {
      Alert.alert("Error", "Could not dislike product.");
    }
  };

  const handleSubmitReview = async () => {
    if (!newReviewText.trim()) return;

    try {
      setSubmittingReview(true);
      const response = await reviewService.createReview(Number(id), {
        rating: newReviewRating,
        content: newReviewText,
      });

      Alert.alert(
        "Submitted",
        "Your review is being processed and will appear shortly.",
      );

      setNewReviewText("");
      setNewReviewRating(5);
      setTimeout(() => {
        fetchProductAndReviews();
      }, 1000);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Could not publish review.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await reviewService.deleteReview(Number(id), reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (error) {
      Alert.alert("Error", "Failed to delete review.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={40} color="#d1d5db" />
        </View>
        <Text className="text-xl text-gray-400 font-bold mb-4">
          Product not found.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-8 py-3 bg-green-500 rounded-2xl"
        >
          <Text className="text-white font-bold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Product Image */}
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            className="w-full h-80 bg-white"
            resizeMode="contain"
          />
        ) : (
          <View className="w-full h-80 bg-green-50 items-center justify-center">
            <Ionicons name="image-outline" size={64} color="#bbf7d0" />
          </View>
        )}

        {/* Product Info Section */}
        <View className="bg-white px-6 py-6 border-b border-gray-100">
          {/* Category & Rating */}
          <View className="flex-row items-center justify-between mb-4">
            {product.categoryName && (
              <View className="bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <Text className="text-green-600 text-xs font-bold">
                  {product.categoryName}
                </Text>
              </View>
            )}

            <View className="flex-row items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text className="text-amber-600 font-bold text-xs ml-1">
                {product.averageRating} ({product.reviewCount} Reviews)
              </Text>
            </View>
          </View>

          <Text className="text-3xl font-extrabold text-gray-900 mb-4">
            {product.name}
          </Text>
          <Text className="text-base text-gray-500 leading-relaxed mb-6">
            {product.description}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-4 border-t border-gray-100 pt-5">
            <TouchableOpacity
              onPress={handleToggleLike}
              className="flex-1 flex-row items-center justify-center py-3.5 bg-green-50 rounded-2xl border border-green-200"
            >
              <Ionicons name="thumbs-up" size={20} color="#22c55e" />
              <Text className="ml-2 font-bold text-green-600 text-base">
                {product.likeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleDislike}
              className="flex-1 flex-row items-center justify-center py-3.5 bg-red-50 rounded-2xl border border-red-200"
            >
              <Ionicons name="thumbs-down" size={20} color="#ef4444" />
              <Text className="ml-2 font-bold text-red-500 text-base">
                {product.dislikeCount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Summary */}
        {product.aiSummary && (
          <View className="mx-6 mt-5 p-5 bg-green-50 rounded-3xl border border-green-100">
            <View className="flex-row items-center mb-2">
              <Ionicons name="sparkles" size={16} color="#16a34a" />
              <Text className="ml-2 text-green-700 font-bold text-sm">
                AI Özeti
              </Text>
            </View>
            <Text className="text-gray-600 leading-relaxed text-sm">
              {product.aiSummary}
            </Text>
          </View>
        )}

        {/* Reviews Section */}
        <View className="px-6 py-8">
          <View className="flex-row items-center mb-6">
            <Ionicons name="chatbubbles-outline" size={22} color="#22c55e" />
            <Text className="text-2xl font-bold text-gray-800 ml-2">
              User Reviews
            </Text>
            <View className="bg-green-50 rounded-full px-3 py-1 ml-3">
              <Text className="text-green-600 font-bold text-xs">
                {reviews.length}
              </Text>
            </View>
          </View>

          {/* Add Review */}
          <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Write a Review
              </Text>
              {/* Star Selector */}
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewReviewRating(star)}
                    className="p-1"
                  >
                    <Ionicons
                      name={star <= newReviewRating ? "star" : "star-outline"}
                      size={20}
                      color={star <= newReviewRating ? "#f59e0b" : "#d1d5db"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              className="bg-gray-50 rounded-2xl p-4 text-gray-800 min-h-[100px] border border-gray-100 focus:border-green-400 mb-4"
              placeholder="What do you think about this product?"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={newReviewText}
              onChangeText={setNewReviewText}
            />
            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={submittingReview || !newReviewText.trim()}
              className={`py-3.5 rounded-2xl items-center ${
                !newReviewText.trim()
                  ? "bg-gray-100"
                  : "bg-green-500 active:bg-green-600"
              }`}
            >
              {submittingReview ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  className={`font-bold text-base ${!newReviewText.trim() ? "text-gray-300" : "text-white"}`}
                >
                  Publish Review
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Review List */}
          {reviews.length === 0 ? (
            <View className="py-10 items-center justify-center">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Ionicons
                  name="chatbubbles-outline"
                  size={28}
                  color="#d1d5db"
                />
              </View>
              <Text className="text-gray-300 mt-2 font-medium text-center px-8">
                No reviews yet. Be the first to share your thoughts!
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {reviews.map((r: any) => (
                <View
                  key={r.id}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-full bg-green-50 items-center justify-center mr-3 border border-green-100">
                        <Text className="text-green-600 font-bold text-xs">
                          {r.username?.substring(0, 2).toUpperCase() || "US"}
                        </Text>
                      </View>
                      <Text className="font-bold text-gray-800">
                        {r.username}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteReview(r.id)}
                      className="p-1.5"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#d1d5db"
                      />
                    </TouchableOpacity>
                  </View>
                  {/* Rating */}
                  <View className="flex-row items-center mb-2 ml-12">
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < r.rating ? "star" : "star-outline"}
                        size={14}
                        color={i < r.rating ? "#f59e0b" : "#e5e7eb"}
                      />
                    ))}
                    <Text className="text-xs font-bold text-amber-500 ml-2">
                      {r.rating}/5
                    </Text>
                  </View>
                  <Text className="text-gray-500 leading-relaxed ml-12">
                    {r.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
