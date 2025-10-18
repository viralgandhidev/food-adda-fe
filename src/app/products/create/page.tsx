"use client";

export const dynamic = "force-dynamic";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import Image from "next/image";
import { FiTrash2, FiPlus, FiArrowLeft, FiUpload } from "react-icons/fi";
import type { DragEndEvent } from "@dnd-kit/core";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { api } from "@/lib/api";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().min(1),
  category_id: z.string().optional(),
  main_category_id: z.string().min(1),
  sub_category_id: z.string().min(1),
  keyword_ids: z.array(z.string()).optional(),
  is_veg: z.boolean(),
  preparation_time: z.coerce.number().min(1),
  images: z.array(z.any()).min(1, "At least one image is required"),
  metrics: z.array(
    z.object({ key: z.string().min(1), value: z.string().min(1) })
  ),
});

type ProductForm = z.infer<typeof productSchema>;

export default function CreateProductPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  // Allow all authenticated users to create products
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [mains, setMains] = useState<{ id: string; name: string }[]>([]);
  const [subs, setSubs] = useState<
    { id: string; name: string; parent_id: string }[]
  >([]);
  const [keywords, setKeywords] = useState<{ id: string; name: string }[]>([]);
  const [keywordQuery, setKeywordQuery] = useState("");
  const keywordsReqSeq = useRef(0);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      images: [],
      metrics: [{ key: "", value: "" }],
      is_veg: false,
    },
  });

  const {
    fields: metricFields,
    append: appendMetric,
    remove: removeMetric,
  } = useFieldArray({
    control,
    name: "metrics",
  });

  // Image upload and order logic
  const images: File[] = watch("images");
  const onDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((f) => f instanceof File);
    if (validFiles.length === 0) {
      setError(
        "Please use the file picker or drag files from your computer. Files from some sources (like VS Code) are not supported."
      );
      return;
    }
    setError("");
    setValue("images", validFiles, { shouldValidate: true });
  };
  const onRemoveImage = (idx: number) => {
    setValue(
      "images",
      images.filter((_, i) => i !== idx),
      { shouldValidate: true }
    );
  };
  // DnD-kit logic
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const dropzone = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    if (oldIndex !== newIndex) {
      setValue("images", arrayMove(images, oldIndex, newIndex), {
        shouldValidate: true,
      });
    }
  };

  // Seller check removed: allow all authenticated users

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data || []);
        // Split mains/subs for the new fields
        const all = (res.data.data || []) as {
          id: string;
          name: string;
          parent_id?: string | null;
        }[];
        setMains(all.filter((c) => !c.parent_id));
        setSubs(all.filter((c) => c.parent_id) as any);
        // keywords will load based on selected main/sub
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Load keywords only for selected main/sub
  const selectedMain = watch("main_category_id");
  const selectedSub = watch("sub_category_id");
  const loadKeywords = (mainId?: string, subId?: string) => {
    keywordsReqSeq.current += 1;
    const seq = keywordsReqSeq.current;
    if (!mainId) {
      setKeywords([]);
      return;
    }
    const params: Record<string, string> = { mainCategoryId: mainId };
    if (subId) params.subCategoryId = subId;
    api
      .get("/keywords", { params })
      .then((res) => {
        if (seq !== keywordsReqSeq.current) return;
        const arr = (res.data?.data || []) as { id: string; name: string }[];
        if (arr.length === 0 && subId) {
          // Fallback: show main-only keywords when sub has none
          const fallbackParams: Record<string, string> = {
            mainCategoryId: mainId,
          };
          return api.get("/keywords", { params: fallbackParams }).then((r2) => {
            if (seq !== keywordsReqSeq.current) return;
            setKeywords(
              (r2.data?.data || []) as { id: string; name: string }[]
            );
          });
        }
        setKeywords(arr);
      })
      .catch(() => {
        if (seq !== keywordsReqSeq.current) return;
        setKeywords([]);
      });
  };

  if (!user) {
    return null;
  }

  const onSubmit = async (data: ProductForm) => {
    setUploading(true);
    setError("");
    try {
      const validImages = (data.images || []).filter((f) => f instanceof File);
      if (validImages.length === 0) {
        setError(
          "Please add at least one valid image file using the file picker or by dragging from your computer."
        );
        setUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append("name", data.name ?? "");
      formData.append("description", data.description ?? "");
      formData.append("price", String(data.price ?? ""));
      formData.append("category_id", data.category_id ?? "");
      formData.append("main_category_id", data.main_category_id ?? "");
      formData.append("sub_category_id", data.sub_category_id ?? "");
      if (data.keyword_ids && data.keyword_ids.length) {
        data.keyword_ids.forEach((id) => formData.append("keyword_ids[]", id));
      }
      formData.append("is_veg", String(data.is_veg ?? false));
      formData.append("preparation_time", String(data.preparation_time ?? ""));

      // All images: each as a separate 'images' field
      validImages.forEach((file) => {
        formData.append("images", file);
      });

      // Order
      formData.append(
        "order",
        JSON.stringify(validImages.map((_, idx) => idx + 1))
      );

      // Metrics
      formData.append(
        "metrics",
        JSON.stringify(data.metrics.filter((m) => m.key && m.value))
      );

      // Debug log: print all FormData keys and values
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Call API
      const res = await api.post("/products", formData);
      if (res.status !== 201) throw new Error("Failed to create product");
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create product");
      } else {
        setError("Failed to create product");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <section className="min-h-[80vh] w-full bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center py-12 px-2">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-yellow-100 p-10 md:p-14">
            <div className="flex items-center gap-4 mb-10">
              <Button
                type="button"
                className="rounded-full bg-[#F4D300] hover:bg-yellow-400 text-[#181818] font-semibold px-6 py-2 shadow transition"
                onClick={() => router.replace("/dashboard")}
              >
                <FiArrowLeft className="mr-2" /> Back
              </Button>
              <h1 className="text-4xl font-extrabold text-[#181818] tracking-tight ml-2 relative">
                Create Product
                <span className="block w-16 h-1 bg-[#F4D300] rounded-full mt-2 absolute left-0 -bottom-3" />
              </h1>
            </div>
            {error && (
              <div className="mb-4 text-red-600 font-semibold text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product name
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="Enter product name"
                    error={errors.name?.message}
                    className="h-12 focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                {/* Main category full width for clear hierarchy */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Main category
                  </label>
                  <select
                    {...register("main_category_id")}
                    className="h-12 w-full rounded-md border border-gray-300 px-3 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition text-gray-900"
                    onChange={(e) => {
                      const val = e.target.value;
                      // clear sub when main changes
                      setValue("main_category_id", val, {
                        shouldValidate: true,
                      });
                      const firstSub = subs.find((s) => s.parent_id === val);
                      if (firstSub) {
                        setValue("sub_category_id", firstSub.id, {
                          shouldValidate: true,
                        });
                        loadKeywords(val || undefined, firstSub.id);
                      } else {
                        setValue("sub_category_id", "", {
                          shouldValidate: true,
                        });
                        loadKeywords(val || undefined, undefined);
                      }
                    }}
                  >
                    <option value="">Select main category</option>
                    {mains.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {errors.main_category_id && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.main_category_id.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sub category
                  </label>
                  <select
                    {...register("sub_category_id")}
                    className="h-12 w-full rounded-md border border-gray-300 px-3 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={!selectedMain}
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue("sub_category_id", val, {
                        shouldValidate: true,
                      });
                      loadKeywords(selectedMain || undefined, val || undefined);
                    }}
                  >
                    <option value="">Select sub category</option>
                    {subs
                      .filter(
                        (s) => !selectedMain || s.parent_id === selectedMain
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  {errors.sub_category_id && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.sub_category_id.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Keywords
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-auto border border-gray-300 rounded-xl p-3 bg-white">
                    {!selectedMain && (
                      <div className="col-span-2 md:col-span-3 text-sm text-gray-500 py-2">
                        Select a main category to load keywords
                      </div>
                    )}
                    {selectedMain && keywords.length === 0 && (
                      <div className="col-span-2 md:col-span-3 text-sm text-gray-500 py-2">
                        No keywords available for this selection
                      </div>
                    )}
                    {keywords.map((k) => {
                      const current = (watch("keyword_ids") || []) as string[];
                      const checked = current.includes(k.id);
                      const pill = checked
                        ? "bg-gray-50 border-gray-400 text-gray-900"
                        : "bg-white border-gray-300 text-gray-800";
                      return (
                        <label
                          key={k.id}
                          className={`flex items-center gap-2 text-sm rounded-full px-3 py-1.5 border cursor-pointer select-none hover:border-gray-400 ${pill}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(
                                    new Set([...(current || []), k.id])
                                  )
                                : (current || []).filter((id) => id !== k.id);
                              setValue("keyword_ids", next, {
                                shouldValidate: true,
                              });
                            }}
                            className="h-4 w-4 accent-gray-600"
                          />
                          <span className="truncate">{k.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Input
                    {...register("price")}
                    type="number"
                    placeholder="Price"
                    error={errors.price?.message}
                    className="h-12 focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div>
                  <Input
                    {...register("preparation_time")}
                    type="number"
                    placeholder="Preparation time (min)"
                    error={errors.preparation_time?.message}
                    className="h-12 focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="hidden">
                  <input
                    type="checkbox"
                    {...register("is_veg")}
                    id="is_veg"
                    className="h-5 w-5 accent-yellow-400"
                  />
                  <label htmlFor="is_veg" className="text-base font-medium">
                    Vegetarian
                  </label>
                </div>
              </div>
              <div>
                <textarea
                  {...register("description")}
                  placeholder="Description"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-yellow-300 text-gray-900"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              {/* Image Upload */}
              <div>
                <label className="block font-semibold mb-3 text-lg text-[#181818]">
                  Product Images
                </label>
                <Controller
                  control={control}
                  name="images"
                  render={() => (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[
                        restrictToVerticalAxis,
                        restrictToParentElement,
                      ]}
                    >
                      <div
                        {...dropzone.getRootProps()}
                        className="border-2 border-dashed border-yellow-300 rounded-xl p-6 flex flex-col items-center cursor-pointer bg-yellow-50 hover:bg-yellow-100 transition mb-4"
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const selectedFiles = files.filter(
                              (f) => f instanceof File
                            );
                            if (selectedFiles.length === 0) {
                              setError(
                                "Please use the file picker or drag files from your computer. Files from some sources (like VS Code) are not supported."
                              );
                              return;
                            }
                            setError("");
                            setValue("images", selectedFiles, {
                              shouldValidate: true,
                            });
                          }}
                        />
                        <FiUpload className="text-4xl text-yellow-400 mb-2" />
                        <span className="text-gray-600 font-medium">
                          Drag & drop images here, or click to select
                        </span>
                      </div>
                      <SortableContext
                        items={images.map((_, i) => i)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-3">
                          {images.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-4 bg-yellow-100 rounded-lg p-2 relative border border-yellow-200"
                            >
                              <div className="w-20 h-20 relative rounded overflow-hidden">
                                <Image
                                  src={URL.createObjectURL(file)}
                                  alt="preview"
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                              <span className="flex-1 truncate font-medium">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => onRemoveImage(idx)}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                />
                {errors.images && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.images.message}
                  </p>
                )}
              </div>
              <div className="border-t border-gray-200 my-8" />
              {/* Metrics */}
              <div>
                <label className="block font-semibold mb-3 text-lg text-[#181818]">
                  Product Metrics
                </label>
                <div className="flex flex-col gap-3">
                  {metricFields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <Input
                        {...register(`metrics.${idx}.key` as const)}
                        placeholder="Key"
                        className="h-10 focus:ring-2 focus:ring-yellow-300"
                      />
                      <Input
                        {...register(`metrics.${idx}.value` as const)}
                        placeholder="Value"
                        className="h-10 focus:ring-2 focus:ring-yellow-300"
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeMetric(idx)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit mt-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    onClick={() => appendMetric({ key: "", value: "" })}
                  >
                    <FiPlus className="mr-1" /> Add Metric
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-[#F4D300] hover:bg-yellow-400 text-[#181818] rounded-2xl shadow mt-6"
                isLoading={isSubmitting || uploading}
              >
                Create Product
              </Button>
            </form>
          </div>
        </section>
      </MainLayout>
    </ProtectedRoute>
  );
}
