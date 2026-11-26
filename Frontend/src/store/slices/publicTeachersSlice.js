import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.service";

export const fetchPublicTeachers = createAsyncThunk(
  "publicTeachers/fetchAll",
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.subject && filters.subject !== "All")
          params.append("subject", filters.subject);
        if (filters.grade && filters.grade !== "All")
          params.append("grade", filters.grade);
        if (filters.city && filters.city !== "All")
          params.append("city", filters.city);
        if (filters.daysPerWeek && filters.daysPerWeek !== "All")
          params.append("daysPerWeek", filters.daysPerWeek);
        if (filters.day && filters.day !== "All")
          params.append("day", filters.day);
        if (filters.duration && filters.duration !== "All")
          params.append("duration", filters.duration);
        if (filters.minPrice && filters.minPrice !== "All")
          params.append("minPrice", filters.minPrice);
        if (filters.maxPrice && filters.maxPrice !== "All")
          params.append("maxPrice", filters.maxPrice);
        if (filters.rating && filters.rating !== "All")
          params.append("rating", filters.rating);
        if (filters.search && filters.search.trim())
          params.append("search", filters.search.trim());
      }
      const response = await api.get(`/teachers?${params.toString()}`);
      return response.data.teachers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch teachers",
      );
    }
  },
);

export const fetchTeacherDetail = createAsyncThunk(
  "publicTeachers/fetchDetail",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/teachers/${teacherId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch teacher profile",
      );
    }
  },
);

const defaultFilters = {
  subject: "All",
  grade: "All",
  city: "All",
  daysPerWeek: "All",
  day: "All",
  duration: "All",
  minPrice: "All",
  maxPrice: "All",
  rating: "All",
  search: "",
};

const initialState = {
  teachers: [],
  currentTeacher: null,
  filters: defaultFilters,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const publicTeachersSlice = createSlice({
  name: "publicTeachers",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = defaultFilters;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL
      .addCase(fetchPublicTeachers.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(fetchPublicTeachers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.teachers = action.payload;
      })
      .addCase(fetchPublicTeachers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // FETCH DETAIL
      .addCase(fetchTeacherDetail.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.currentTeacher = null;
      })
      .addCase(fetchTeacherDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentTeacher = action.payload;
      })
      .addCase(fetchTeacherDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { setFilter, resetFilters } = publicTeachersSlice.actions;
export default publicTeachersSlice.reducer;
