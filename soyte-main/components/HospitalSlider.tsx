import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/prime";
import {
  affiliatedFacilitiesService,
  type AffiliatedFacility,
} from "../services/affiliatedFacilitiesService";

const HospitalSlider = () => {
  const [hospitals, setHospitals] = useState<AffiliatedFacility[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const itemsToShow = { desktop: 4, tablet: 3, mobile: 2 };

  const getVisibleItems = () => {
    if (typeof window === "undefined") return itemsToShow.desktop;
    if (window.innerWidth < 640) return itemsToShow.mobile;
    if (window.innerWidth < 1024) return itemsToShow.tablet;
    return itemsToShow.desktop;
  };

  const [visibleCount, setVisibleCount] = useState(4);
  const maxStartIndex = Math.max(hospitals.length - visibleCount, 0);

  useEffect(() => {
    let mounted = true;

    const fetchHospitals = async () => {
      try {
        const data = await affiliatedFacilitiesService.getAll();
        if (mounted) {
          setHospitals(data);
        }
      } catch (error) {
        console.error("Error fetching affiliated facilities:", error);
        if (mounted) {
          setHospitals([]);
        }
      }
    };

    fetchHospitals();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleItems());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = useCallback(() => {
    if (hospitals.length <= visibleCount) return;
    setCurrentIndex((prev) => (prev >= maxStartIndex ? 0 : prev + 1));
  }, [hospitals.length, maxStartIndex, visibleCount]);

  const prevSlide = () => {
    if (hospitals.length <= visibleCount) return;
    setCurrentIndex((prev) => (prev <= 0 ? maxStartIndex : prev - 1));
  };

  useEffect(() => {
    if (isPaused || hospitals.length <= visibleCount) return;
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, [hospitals.length, isPaused, nextSlide, visibleCount]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxStartIndex));
  }, [maxStartIndex]);

  if (hospitals.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-primary-900 uppercase tracking-tight">
              Hệ thống cơ sở Y tế trực thuộc
            </h3>
            <div className="w-16 h-1 bg-secondary-500 mt-2 rounded-full"></div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={prevSlide}
              icon={<ChevronLeft size={20} />}
              rounded
              text
              className="p-2 !border-gray-200 !bg-white hover:!bg-primary-50 !text-gray-400 hover:!text-primary-600 shadow-sm active:scale-90"
              aria-label="Previous slide"
            />
            <Button
              onClick={nextSlide}
              icon={<ChevronRight size={20} />}
              rounded
              text
              className="p-2 !border-gray-200 !bg-white hover:!bg-primary-50 !text-gray-400 hover:!text-primary-600 shadow-sm active:scale-90"
              aria-label="Next slide"
            />
          </div>
        </div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            }}
          >
            {hospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div className="bg-white border border-gray-100 rounded-2xl p-6 h-56 flex flex-col items-center justify-center text-center group hover:shadow-2xl hover:border-primary-200 transition-all duration-500 cursor-pointer">
                  <div className="w-28 h-28 mb-4 flex items-center justify-center transition-all duration-700 transform group-hover:scale-110">
                    <img
                      crossOrigin="anonymous"
                      src={hospital.logo}
                      alt={hospital.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://storage-vnportal.vnpt.vn/gov-hni/6749/soyte.png";
                      }}
                    />
                  </div>
                  <h4 className="text-[13px] font-black text-gray-700 group-hover:text-primary-800 transition-colors uppercase tracking-tight leading-tight px-2">
                    {hospital.name}
                  </h4>
                  <div className="mt-3 w-8 h-1 bg-gray-100 group-hover:bg-primary-500 transition-all duration-500 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HospitalSlider;
