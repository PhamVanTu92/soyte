export const getDefaultDates = () => {
  const now = new Date();

  // Tháng hiện tại
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Lùi 11 tháng (để đủ 12 tháng tính cả hiện tại)
  const startDate = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() - 11,
    1
  );

  // Ngày cuối tháng hiện tại
  const endDate = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

export const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const formatDisplayDateTime = (dateStr: string) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "—";
  }
};
