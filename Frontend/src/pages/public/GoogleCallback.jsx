import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTempGoogleAuth } from "../../store/slices/authSlice";
import LoadingState from "../../components/common/LoadingState";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const tempToken = searchParams.get("tempToken");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const picture = searchParams.get("picture");

    if (tempToken && email) {
      dispatch(
        setTempGoogleAuth({
          tempToken,
          email,
          name: name || "",
          picture: picture || "",
        }),
      );
      // Navigate to /register with pre-filled state
      navigate("/register", {
        replace: true,
        state: { tempToken, email, name, picture },
      });
    } else {
      // If code was passed directly, try backend or redirect to login
      navigate("/login");
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingState message="Processing Google sign in..." />
    </div>
  );
}
