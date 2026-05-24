import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { categoryService } from "../../services/categoryService";
import { productService } from "../../services/productService";

const SORT_OPTIONS = [
  { key: "newest",      label: "Newest",        icon: "time-outline" },
  { key: "mostReviewed", label: "Most Reviewed", icon: "star-outline" },
  { key: "mostLiked",   label: "Most Liked",     icon: "thumbs-up-outline" },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["key"];

export default function Products() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [products, setProducts]       = useState<any[]>([]);
  const [categories, setCategories]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);

  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<SortKey>("newest");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const filtersRef    = useRef({ search: "", sortBy: "newest" as SortKey, categoryId: undefined as number | undefined });
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMoreRef    = useRef(true);

  useEffect(() => {
    categoryService.getCategories().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (pageNumber: number, isRefresh = false) => {
    if (!isRefresh && !hasMoreRef.current) return;
    const { search: s, sortBy: sort, categoryId: cat } = filtersRef.current;
    try {
      if (!isRefresh) setLoading(true);
      const response       = await productService.getProducts(pageNumber, 10, s, sort, cat);
      const newProducts: any[] = response.data;

      if (newProducts.length < 10) {
        hasMoreRef.current = false;
        setHasMore(false);
      }

      if (isRefresh) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }
    } catch {
      // silently fail
    } finally {
      if (!isRefresh) setLoading(false);
      if (isRefresh)  setRefreshing(false);
    }
  }, []);

  const resetAndFetch = useCallback(() => {
    hasMoreRef.current = true;
    setPage(1);
    setHasMore(true);
    setRefreshing(true);
    setProducts([]);
    fetchProducts(1, true);
  }, [fetchProducts]);

  useEffect(() => {
    resetAndFetch();
  }, []);

  const onRefresh = useCallback(() => {
    resetAndFetch();
  }, [resetAndFetch]);

  const loadMore = () => {
    if (!loading && hasMoreRef.current) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    filtersRef.current = { ...filtersRef.current, search: text };
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => resetAndFetch(), 400);
  };

  const handleSortChange = (key: SortKey) => {
    setSortBy(key);
    filtersRef.current = { ...filtersRef.current, sortBy: key };
    resetAndFetch();
  };

  const handleCategoryChange = (id: number | undefined) => {
    setCategoryId(id);
    filtersRef.current = { ...filtersRef.current, categoryId: id };
    resetAndFetch();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
      activeOpacity={0.9}
      onPress={() => router.push(`/product/${item.id}` as any)}
    >
      <View className="relative w-full h-40 bg-gray-100">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full bg-green-50/50 items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#bbf7d0" />
          </View>
        )}
        {item.categoryName && (
          <View className="absolute top-4 left-4 bg-white/90 px-4 py-1.5 rounded-full shadow-sm">
            <Text className="text-green-600 text-xs font-black tracking-widest uppercase">{item.categoryName}</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-lg font-extrabold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
        <Text className="text-gray-500 text-sm leading-relaxed mb-3" numberOfLines={2}>{item.description}</Text>

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

  const filtersHeader = (
    <View className="mb-4">
      {/* Sort Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2 pr-4">
          {SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => handleSortChange(opt.key)}
                className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${
                  active ? "bg-green-500 border-green-500" : "bg-white border-gray-200"
                }`}
              >
                <Ionicons name={opt.icon as any} size={14} color={active ? "#fff" : "#6b7280"} />
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-4">
          <TouchableOpacity
            onPress={() => handleCategoryChange(undefined)}
            className={`px-4 py-2 rounded-full border ${
              categoryId === undefined ? "bg-green-500 border-green-500" : "bg-white border-gray-200"
            }`}
          >
            <Text className={`text-xs font-semibold ${categoryId === undefined ? "text-white" : "text-gray-600"}`}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-full border ${
                  active ? "bg-green-500 border-green-500" : "bg-white border-gray-200"
                }`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50/50">
      <StatusBar barStyle="dark-content" />

      {/* Search Bar — FlatList dışında, klavye kapanma sorunu olmaz */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center bg-white rounded-2xl border border-gray-200 px-4 py-3 gap-3">
          <Ionicons name="search-outline" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 text-gray-900 text-sm"
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        className="flex-1 px-5"
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={filtersHeader}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} tintColor="#22c55e" />
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : !hasMore && products.length > 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-400 font-medium text-sm tracking-wide">You've reached the end!</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !refreshing ? (
            <View className="flex-1 justify-center items-center py-24">
              <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm shadow-gray-200">
                <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              </View>
              <Text className="text-gray-800 text-xl font-bold mb-2">No Products Found</Text>
              <Text className="text-gray-400 text-center px-10">
                {search ? `No results for "${search}"` : "Check back later or add a new product."}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
