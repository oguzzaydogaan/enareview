import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
        rating: 5,
        content: newReviewText,
      });

      Alert.alert(
        "Submitted",
        "Your review is being processed and will appear shortly.",
      );

      setNewReviewText("");
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
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <Text className="text-xl text-slate-500 font-bold mb-4">
          Product not found.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 bg-red-600 rounded-full"
        >
          <Text className="text-white font-bold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Product Info Section */}
        <View className="bg-white px-6 py-8 border-b border-slate-100">
          <View className="w-20 h-20 bg-red-100 rounded-3xl mb-6 items-center justify-center">
            <Ionicons name="cube" size={40} color="#dc2626" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 mb-4">
            {product.name}
          </Text>
          <Text className="text-base text-slate-600 leading-relaxed mb-8">
            {product.description}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-4 border-t border-slate-100 pt-6 mt-2">
            <TouchableOpacity
              onPress={handleToggleLike}
              className="flex-1 flex-row items-center justify-center py-3 bg-green-50 rounded-2xl border border-green-200"
            >
              <Ionicons name="thumbs-up-outline" size={22} color="#16a34a" />
              <Text className="ml-2 font-bold text-green-700">
                {product.likeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleDislike}
              className="flex-1 flex-row items-center justify-center py-3 bg-red-50 rounded-2xl border border-red-200"
            >
              <Ionicons name="thumbs-down-outline" size={22} color="#dc2626" />
              <Text className="ml-2 font-bold text-red-700">
                {product.dislikeCount}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reviews Section */}
        <View className="px-6 py-8">
          <Text className="text-2xl font-bold text-slate-800 mb-6">
            User Reviews
          </Text>

          {/* Add Review */}
          <View className="bg-white p-4 rounded-2xl border border-slate-200 mb-8 shadow-sm">
            <Text className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
              Write a Review
            </Text>
            <TextInput
              className="bg-slate-50 rounded-xl p-4 text-slate-800 min-h-[100px] border border-slate-100 focus:border-red-400 mb-4"
              placeholder="What do you think about this product?"
              multiline
              textAlignVertical="top"
              value={newReviewText}
              onChangeText={setNewReviewText}
            />
            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={submittingReview || !newReviewText.trim()}
              className={`py-3 rounded-xl items-center ${
                !newReviewText.trim()
                  ? "bg-slate-200"
                  : "bg-slate-900 active:bg-slate-800"
              }`}
            >
              {submittingReview ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  className={`font-bold text-base ${!newReviewText.trim() ? "text-slate-400" : "text-white"}`}
                >
                  Publish Review
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Review List */}
          {reviews.length === 0 ? (
            <View className="py-10 items-center justify-center">
              <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-4 font-medium text-center px-8">
                No reviews yet. Be the first to share your thoughts!
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {reviews.map((r: any) => (
                <View
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-3">
                        <Text className="text-indigo-700 font-bold text-xs">
                          {r.username?.substring(0, 2).toUpperCase() || "US"}
                        </Text>
                      </View>
                      <Text className="font-bold text-slate-800">
                        {r.username}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteReview(r.id)}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                  {/* Rating placeholder */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text className="text-xs font-bold text-amber-600 ml-1">
                      {r.rating} / 5
                    </Text>
                  </View>
                  <Text className="text-slate-600 leading-relaxed">
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
