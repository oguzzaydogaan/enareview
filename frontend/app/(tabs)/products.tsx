import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { productService } from "../../services/productService";

export default function Products() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const username = params.username || "User";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (pageNumber: number, isRefresh = false) => {
    if (!hasMore && !isRefresh) return;
    try {
      if (!isRefresh) setLoading(true);
      const response = await productService.getProducts(pageNumber, 10);
      const newProducts = response.data;

      if (newProducts.length < 10) {
        setHasMore(false);
      }

      if (isRefresh) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      if (!isRefresh) setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
      activeOpacity={0.9}
      onPress={() => router.push(`/product/${item.id}` as any)}
    >
      {/* Product Image Area */}
      <View className="relative w-full h-40 bg-gray-100">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-green-50/50 items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#bbf7d0" />
          </View>
        )}
        
        {/* Category Badge Floating on Image */}
        {item.categoryName && (
          <View className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
            <Text className="text-green-600 text-xs font-black tracking-widest uppercase">{item.categoryName}</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        {/* Title */}
        <Text className="text-lg font-extrabold text-gray-900 mb-1" numberOfLines={1}>
          {item.name}
        </Text>

        {/* Description */}
        <Text className="text-gray-500 text-sm leading-relaxed mb-3" numberOfLines={2}>
          {item.description}
        </Text>

        {/* Stats Row */}
        <View className="flex-row items-center justify-between border-t border-gray-50 pt-3">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-100">
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text className="text-amber-600 font-bold text-xs">{item.averageRating} ({item.reviewCount})</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-green-50 px-2 py-1.5 rounded-xl border border-green-100">
              <Ionicons name="thumbs-up" size={14} color="#22c55e" />
              <Text className="text-green-700 font-bold text-xs">{item.likeCount}</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-red-50 px-2 py-1.5 rounded-xl border border-red-100">
              <Ionicons name="thumbs-down" size={14} color="#ef4444" />
              <Text className="text-red-600 font-bold text-xs">{item.dislikeCount}</Text>
            </View>
          </View>
          <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center">
            <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50/50">
      <StatusBar barStyle="dark-content" />

      {/* List */}
      <FlatList
        className="flex-1 px-5 pt-6"
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#22c55e"]}
          />
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : !hasMore && products.length > 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-400 font-medium text-sm tracking-wide">
                You've reached the end!
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !refreshing ? (
            <View className="flex-1 justify-center items-center py-32">
              <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm shadow-gray-200">
                <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              </View>
              <Text className="text-gray-800 text-xl font-bold mb-2">
                No Products Yet
              </Text>
              <Text className="text-gray-400 text-center px-10">
                Check back later or add a new product to get started.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
