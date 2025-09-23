"use client";

import React, { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";
import { useForm, FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const ProductDetailsPage = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Add state for categories
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Define onSubmit function with proper typing
  const onSubmit = async (data: FieldValues) => {
    setIsSubmitting(true);
    try {
      // Handle form submission logic here
      console.log(data);
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define isSubmitting and uploading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Function to handle opening the edit modal
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  // Function to handle closing the edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // Use uploading state in the form
  const handleFileChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    // Handle file upload logic here
    setUploading(false);
  };

  return (
    <div>
      <button
        onClick={handleEditClick}
        className="text-blue-500 hover:text-blue-700"
      >
        <FiEdit />
      </button>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative max-h-[80vh] flex flex-col">
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-8 py-5 border-b border-gray-200 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-[#181818]">
                Edit Product
              </h3>
              <button
                className="text-2xl text-[#181818] hover:text-[#F4D300] ml-4"
                onClick={handleCloseEditModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto px-2 py-4 flex-1">
              {/* Add your edit form here */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      {...register("name")}
                      placeholder="Product name"
                      error={errors.name?.message as string}
                      className="h-12 focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                  <div>
                    <select
                      {...register("category_id")}
                      className="h-12 w-full rounded-md border border-gray-300 px-3 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.category_id.message as string}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      {...register("price")}
                      type="number"
                      placeholder="Price"
                      error={errors.price?.message as string}
                      className="h-12 focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                  <div>
                    <Input
                      {...register("preparation_time")}
                      type="number"
                      placeholder="Preparation time (min)"
                      error={errors.preparation_time?.message as string}
                      className="h-12 focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-yellow-300"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.description.message as string}
                    </p>
                  )}
                </div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image"
                  accept="image/*"
                />
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold bg-[#F4D300] hover:bg-yellow-400 text-[#181818] rounded-2xl shadow mt-6"
                  isLoading={isSubmitting || uploading}
                >
                  Update Product
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;
