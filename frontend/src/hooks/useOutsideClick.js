import { useEffect } from "react";

/**
 * Custom hook to trigger a callback when clicking outside specified React Ref elements.
 */
export const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    // Attach listener
    document.addEventListener("mousedown", handleOutsideClick);

    // Detach listener
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [ref, callback]);
};

export default useOutsideClick;
