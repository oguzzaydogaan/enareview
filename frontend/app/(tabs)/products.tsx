import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
      className="bg-white p-5 rounded-2xl mb-4 border border-slate-100 shadow-sm"
      onPress={() => router.push(`/product/${item.id}` as any)}
    >
      <Text className="text-xl font-bold text-slate-800 mb-2 truncate">
        {item.name}
      </Text>
      <Text className="text-slate-500 text-sm mb-4" numberOfLines={2}>
        {item.description}
      </Text>

      <View className="flex-row items-center gap-6">
        <View className="flex-row items-center gap-2">
          <Ionicons name="thumbs-up-outline" size={18} color="#16a34a" />
          <Text className="text-slate-600 font-medium">{item.likeCount}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="thumbs-down-outline" size={18} color="#dc2626" />
          <Text className="text-slate-600 font-medium">
            {item.dislikeCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* List */}
      <FlatList
        className="flex-1 px-4 pt-4"
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#dc2626"]}
          />
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#dc2626" />
            </View>
          ) : !hasMore && products.length > 0 ? (
            <View className="py-8 items-center">
              <Text className="text-slate-400 font-medium">
                No more products to show.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !refreshing ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="cube-outline" size={64} color="#cbd5e1" />
              <Text className="text-slate-500 text-lg mt-4 font-medium">
                No products found.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
