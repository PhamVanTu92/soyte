import { useState, useEffect, useMemo } from "react";
import {
  Printer,
  ChevronRight,
  CalendarDays,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/prime";
import { WorkSchedule as WorkScheduleType } from "@/types";
import { format, parseISO, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { useSchedules } from "../services/useSchedules";
interface GroupedSchedule {
  dateKey: string;
  formattedDate: string;
  isToday: boolean;
  items: WorkScheduleType[];
}

const handlePrint = () => {
  const printContent = document.getElementById("print-area")!.innerHTML;
  const originalContent = document.body.innerHTML;
  document.body.innerHTML = printContent;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload();
};

const formatTimeVN = (isoString: string | Date) => {
  const date = typeof isoString === 'string' ? parseISO(isoString) : isoString;
  const hour = format(date, "H");
  const minute = format(date, "mm");
  return `${hour} giờ ${minute}`;
};

const WorkSchedule = () => {
  const { schedules, loading, fetchSchedules } = useSchedules();
  // Effect to fetch schedules from start of current week onwards
  useEffect(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    fetchSchedules({
      page: 1,
      limit: 200,
      startDate: format(weekStart, "yyyy-MM-dd"),
    });
  }, [fetchSchedules]);

  // Grouping schedules by date
  const groupedSchedules = useMemo(() => {
    if (schedules.length === 0) return [];

    const today = new Date();
    const normalizedToday = startOfDay(today);

    const grouped = schedules.reduce(
      (acc: { [key: string]: GroupedSchedule }, current) => {
        const itemDate = parseISO(current.start_time);
        const normalizedItemDate = startOfDay(itemDate);
        const dateKey = format(itemDate, "yyyy-MM-dd");

        const formattedDate = format(itemDate, "EEEE, 'ngày' dd/MM/yyyy", {
          locale: vi,
        });
        const isCurrentDay = isSameDay(normalizedItemDate, normalizedToday);

        if (!acc[dateKey]) {
          acc[dateKey] = {
            dateKey: dateKey,
            formattedDate: formattedDate,
            isToday: isCurrentDay,
            items: [],
          };
        }
        acc[dateKey].items.push(current);
        return acc;
      },
      {},
    );

    return Object.values(grouped).sort(
      (a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime(),
    );
  }, [schedules]);

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Set selectedDateKey based on fetched schedules or current date
  useEffect(() => {
    if (groupedSchedules.length > 0) {
      const todaySchedule = groupedSchedules.find((day) => day.isToday);
      if (todaySchedule) setSelectedDateKey(todaySchedule.dateKey);
      else setSelectedDateKey(groupedSchedules[0].dateKey);
    } else {
      setSelectedDateKey(null);
    }
  }, [groupedSchedules]);

  const selectedDay = useMemo(() => groupedSchedules.find((day) => day.dateKey === selectedDateKey), [groupedSchedules, selectedDateKey]);

  return (
    <div className="bg-gray-50 font-sans ">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center text-xs font-bold text-gray-500 uppercase">
          <Link to="/" className="hover:text-red-600 flex items-center gap-1">
            <Home size={14} /> TRANG CHỦ
          </Link>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          <span className="text-red-600">Lịch công tác lãnh đạo</span>
        </div>
      </div>
      <div className="container mx-auto px-4 py-4" id="print-area">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <CalendarDays size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                Lịch công tác Lãnh đạo Sở
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Ban Giám đốc Sở Y tế Thành phố Hà Nội
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              label="In lịch tuần"
              icon={<Printer size={18} />}
              onClick={() => handlePrint()}
              outlined
              className="!border-gray-200 hover:!border-red-600 !text-gray-700 font-bold gap-2"
            />
            <div className="bg-red-70 border border-red-100 px-4 py-2.5 rounded-xl text-red-500 text-xs font-black flex items-center gap-2">
              <AlertCircle size={16} /> HOTLINE TRỰC BAN: 024.3998.5765
            </div>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-white p-4 rounded-3xl shadow-lg border border-gray-100 sticky top-4"> 
            {groupedSchedules.find((day) => day.isToday) &&
              selectedDateKey !==
                groupedSchedules.find((day) => day.isToday)?.dateKey && (
                <Button
                  onClick={() =>
                    setSelectedDateKey(
                      groupedSchedules.find((day) => day.isToday)?.dateKey ||
                        null,
                    )
                  }
                  label="Xem lịch hôm nay"
                  icon="pi pi-calendar"
                  iconPos="left"
                  className="w-full text-left px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                  text
                />
              )}
            <ul>
              {groupedSchedules
                .filter((day) => !day.isToday)
                .map((day) => {
                  const sortedItems = [...day.items].sort(
                    (a, b) =>
                      new Date(a.start_time).getTime() -
                      new Date(b.start_time).getTime(),
                  );
                  return (
                    <li
                      key={day.dateKey}
                      className="my-2 bg-gray-100 rounded-2xl"
                    >
                      <Button
                        onClick={() => setSelectedDateKey(day.dateKey)}
                        text
                        className={`w-full grid text-left px-4 py-2 rounded-lg transition-colors duration-200 text-red-500 hover:bg-gray-100`}
                      >
                        <span className="flex font-bold items-center text-blue-500">
                          {day.formattedDate}
                        </span>
                        <ul className=" mt-1 space-y-1  text-sm">
                          {sortedItems.map((item) => (
                            <li key={item.id} className="gap-1 py-1">
                              <span className="text-red-500 font-bold">
                                {formatTimeVN(item.start_time)} :
                              </span>
                              <span className="flex-1 pl-1 text-[#660000]">{item.content.substring(0, 50)}</span>
                            </li>
                          ))}
                        </ul>
                      </Button>
                    </li>
                  );
                })}
            </ul>
          </div>
          <div className="flex-[3]">
            {loading ? (
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 text-center text-gray-500">
                <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                Đang tải lịch công tác...
              </div>
            ) : selectedDay ? (
              <div
                className={`relative bg-white rounded-3xl shadow-lg border border-gray-100 p-4
                  ${selectedDay.isToday ? "ring-2 ring-red-200" : ""}`}
              >
                <h3
                  className={`text-xl font-black uppercase mb-3 pb-2 border-b border-gray-100  text-center text-[#0033FF]`}
                >
                  {selectedDay.formattedDate}
                </h3>

                <div className="divide-y divide-gray-100">
                  {[...selectedDay.items]
                    .sort(
                      (a, b) =>
                        new Date(a.start_time).getTime() -
                        new Date(b.start_time).getTime(),
                    )
                    .map((item) => (
                      <div key={item.id}>
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center gap-2 font-black text-red-500">
                              {format(parseISO(item.start_time), "HH:mm")} 
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className=" text-[#006633]">
                              {item.content}
                            </p>
                            {/* {item.location && (
                              <p className="text-sm text-[#660000] leading-relaxed mb-2 text-justify">
                                {item.leader} : {item.content} tại {item.location}
                              </p>
                            )}
                            {!item.location && (
                              <p className="text-sm text-[#660000] leading-relaxed mb-2 text-justify">
                                {item.leader} : {item.content}
                              </p>
                            )} */}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 text-center text-[#660000]">
                {loading ? "Đang tải..." : "Không có lịch công tác cho ngày được chọn hoặc trong phạm vi này."}
              </div>
            )}
          </div>
        </div> 
      </div>
    </div>
  );
};

export default WorkSchedule;
