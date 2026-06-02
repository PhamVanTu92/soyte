import React from 'react';
import { Dialog } from 'primereact/dialog';
import { FeedbackItem } from '../../types/feedbacks';
import { formatDisplayDateTime } from '../../utils/dateUtils';
import { Button } from 'primereact/button';
import { Trash2 } from 'lucide-react';
import { confirmDialog } from 'primereact/confirmdialog';

interface FeedbackDetailsDialogProps {
  dialogVisible: boolean;
  setDialogVisible: (visible: boolean) => void;
  selectedFeedback: FeedbackItem | null;
  infoLabels: Record<string, string>;
  type?: string;
  onDelete?: (id: string) => void;
}

const resolveInfoValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object" && "value" in value) return String(value.value);
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    try { return new Date(str).toLocaleDateString("vi-VN"); } catch { /* fall through */ }
  }
  return str;
};

const parseInfoEntries = (info: Record<string, any>, labels?: Record<string, string>): { label: string; value: string }[] => {
  if (!info || typeof info !== "object") return [];
  return Object.keys(info)
    .filter(k => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map(k => {
      const label = labels && labels[k] ? labels[k] : `Thông tin ${k}`;
      return { label, value: resolveInfoValue(info[k]?.value) };
    });
};

const RATING_CFG: Record<number, { label: string; bg: string; text: string; dot: string }> = {
  0: { label: "Không dùng", bg: "bg-slate-100", text: "text-slate-400", dot: "bg-slate-300" },
  1: { label: "Rất kém", bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  2: { label: "Kém", bg: "bg-orange-100", text: "text-orange-600", dot: "bg-orange-500" },
  3: { label: "Trung bình", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  4: { label: "Tốt", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  5: { label: "Rất tốt", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const RatingBadge: React.FC<{ value: number }> = ({ value }) => {
  const cfg = RATING_CFG[value] ?? RATING_CFG[0];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {value > 0 ? `${value}/5 — ` : ""}{cfg.label}
    </span>
  );
};

export const FeedbackDetailsDialog: React.FC<FeedbackDetailsDialogProps> = ({
  dialogVisible,
  setDialogVisible,
  selectedFeedback,
  infoLabels,
  type,
  onDelete
}) => {
  const handleDelete = () => {
    const id = selectedFeedback?.id || selectedFeedback?._id;
    if (!id || !onDelete) return;

    confirmDialog({
      message: 'Bạn có chắc chắn muốn xoá phản hồi này?',
      header: 'Xác nhận xoá',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xoá',
      rejectLabel: 'Hủy',
      acceptClassName: "!bg-red-600 !border-red-600 hover:!bg-red-700 !px-6 !py-2.5 !rounded-xl !font-black !text-white !shadow-lg !shadow-red-100 !transition-all !transform hover:!-translate-y-0.5",
      rejectClassName: "!text-gray-600 hover:!bg-gray-50 !px-6 !py-2.5 !rounded-xl !font-black !border-none !transition-all",
      accept: () => {
        onDelete(id);
        setDialogVisible(false);
      }
    });
  };

  return (
    <Dialog
      header="Chi tiết phiếu đã điền"
      visible={dialogVisible}
      style={{ width: "95vw" }}
      maximizable
      onHide={() => setDialogVisible(false)}
      breakpoints={{ "960px": "95vw", "641px": "100vw" }}
      contentClassName="p-0 bg-slate-50"
      headerClassName="bg-white border-b border-slate-200 text-primary-900 font-bold text-xl"
    >
      {selectedFeedback && (
        <div className="flex flex-col h-full text-sm">
          {/* ── TITLE + META STRIP ───────────────────────────────── */}
          <div className="bg-white border-b border-slate-100 px-6 py-4 flex-shrink-0">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <h3 className="font-bold text-primary-900 text-base leading-snug">
                {selectedFeedback.info?.title || "Chi tiết phản hồi"}
              </h3>
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {onDelete && (
                  <Button
                    icon={<Trash2 size={16} />}
                    label="XOÁ PHẢN HỒI"
                    onClick={handleDelete}
                    className="!bg-red-100 !text-red-700 !border-red-200 hover:!bg-red-200 !px-4 !py-2 !rounded-xl !text-[10px] !font-black !tracking-widest !transition-all !shadow-sm"
                  />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="opacity-50">Ngày gửi:</span>{" "}
                  {formatDisplayDateTime(selectedFeedback.created_at || selectedFeedback.createdAt || selectedFeedback.date)}
                </span>
                {selectedFeedback.creator_name && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                    <span className="opacity-50">Người gửi:</span>{" "}
                    {selectedFeedback.creator_name}
                  </span>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-100/50">
                  Đã tiếp nhận
                </span>
              </div>
            </div>

            {selectedFeedback.info?.description && (
              <div className="pt-3 border-t border-slate-50">
                <p className="text-slate-500 text-xs leading-relaxed italic">
                  {selectedFeedback.info.description}
                </p>
              </div>
            )}
          </div>

          {/* ── INFO CARDS (dynamic numeric keys) ────────────────── */}
          {selectedFeedback.info &&
            parseInfoEntries(selectedFeedback.info, infoLabels).length > 0 && (
              <div className="px-6 pt-4 pb-3 flex-shrink-0 bg-slate-50 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Thông tin chung
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {parseInfoEntries(selectedFeedback.info, infoLabels).map((entry, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-1"
                    >
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        {entry.label}
                      </span>
                      <span className="text-sm font-medium text-slate-800 break-words">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* ── DATA SECTION ─────────────────────────────────────── */}
          <div className="flex-grow overflow-auto p-6 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Nội dung biểu mẫu
            </h4>

            {type === 'reflect' && selectedFeedback.sections?.length > 0 && (
              <div className="flex-grow flex flex-col">
                <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full border-collapse text-slate-700 table-fixed">
                    <thead className="bg-primary-800 text-white">
                      <tr>
                        <th rowSpan={2} className="border border-white/30 p-2 w-[4%] text-center align-middle font-bold text-[11px]">STT</th>
                        <th rowSpan={2} className="border border-white/30 p-2 w-[28%] text-center align-middle font-bold text-[11px]">Nội dung thực hiện</th>
                        <th rowSpan={2} className="border border-white/30 p-2 w-[16%] text-center align-middle font-bold text-[11px]">Phương thức thực hiện</th>
                        <th rowSpan={2} className="border border-white/30 p-2 w-[14%] text-center align-middle font-bold text-[11px]">Sản phẩm đầu ra</th>
                        <th colSpan={3} className="border border-white/30 p-1.5 w-[18%] text-center align-middle font-bold text-[11px]">Tiến độ</th>
                        <th colSpan={2} className="border border-white/30 p-1.5 w-[10%] text-center align-middle font-bold text-[11px]">Đánh giá</th>
                        <th rowSpan={2} className="border border-white/30 p-2 w-[10%] text-center align-middle font-bold text-[11px]">Ghi chú</th>
                      </tr>
                      <tr>
                        <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Đã làm</th>
                        <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Đang làm</th>
                        <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Chưa làm</th>
                        <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">Đạt</th>
                        <th className="border border-white/30 p-1.5 text-center text-[10px] font-bold leading-tight">K.Đạt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let globalIdx = 0;
                        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
                        return selectedFeedback.sections.map((group: any, gi: number) => (
                          <React.Fragment key={gi}>
                            <tr className="bg-primary-800">
                              <td className="p-2.5 text-center">
                                <span className="inline-flex w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold items-center justify-center">
                                  {roman[gi] || gi + 1}
                                </span>
                              </td>
                              <td colSpan={9} className="p-2.5 font-bold text-white text-sm">
                                {group.name || `Nhóm nội dung ${gi + 1}`}
                              </td>
                            </tr>
                            {group.option && Array.isArray(group.option) && group.option.map((opt: any, oi: number) => {
                              globalIdx++;
                              return (
                                <tr key={oi} className="hover:bg-slate-50 transition-colors bg-white">
                                  <td className="border border-slate-300 p-2 text-center text-slate-600 font-medium">{globalIdx}</td>
                                  <td className="border border-slate-300 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.content}</div></td>
                                  <td className="border border-slate-300 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.method}</div></td>
                                  <td className="border border-slate-300 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.productOut}</div></td>

                                  <td className="border border-slate-300 p-2 text-center bg-slate-50/30">
                                    <div className="flex justify-center">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.tiendo) === 1 ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}`}>
                                        {Number(opt.tiendo) === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-slate-300 p-2 text-center bg-slate-50/30">
                                    <div className="flex justify-center">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.tiendo) === 2 ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}`}>
                                        {Number(opt.tiendo) === 2 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-slate-300 p-2 text-center bg-slate-50/30">
                                    <div className="flex justify-center">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.tiendo) === 3 ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}`}>
                                        {Number(opt.tiendo) === 3 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="border border-slate-300 p-2 text-center bg-green-50/30">
                                    <div className="flex justify-center">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Number(opt.danhgia) === 1 ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}>
                                        {Number(opt.danhgia) === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-slate-300 p-2 text-center bg-red-50/30">
                                    <div className="flex justify-center">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${(Number(opt.danhgia) === 0 || Number(opt.danhgia) === 2) ? 'bg-red-600 border-red-600' : 'bg-white border-slate-300'}`}>
                                        {(Number(opt.danhgia) === 0 || Number(opt.danhgia) === 2) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="border border-slate-200 p-3 text-sm leading-relaxed"><div className="whitespace-pre-wrap">{opt.ghichu}</div></td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {type === 'evaluate' && selectedFeedback.sections?.length > 0 && (
              <div className="flex-grow flex flex-col gap-4">
                {(() => {
                  let globalIdx = 0;
                  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
                  return selectedFeedback.sections.map((section: any, sIdx: number) => (
                    <div key={sIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-primary-800 px-4 py-2.5 flex items-center gap-2">
                        <span className="inline-flex w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold items-center justify-center flex-shrink-0">
                          {roman[sIdx] || sIdx + 1}
                        </span>
                        <span className="text-white font-semibold text-sm uppercase tracking-wide">
                          {section.name}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {section.option && Array.isArray(section.option) && section.option.map((opt: any, oIdx: number) => {
                          globalIdx++;
                          const rv = opt.ratingVote?.value;
                          const hasRV = rv !== undefined && rv !== null;
                          const aType: string = opt.answerType || "score1_5";
                          const av = opt.answerValue;
                          const hasAv = av !== null && av !== undefined && av !== "" && av !== -1;

                          return (
                            <div key={oIdx} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-4">
                              <span className="flex-shrink-0 w-6 text-center text-slate-500 text-sm font-medium mt-0.5">
                                {globalIdx}
                              </span>
                              <div className="flex-grow min-w-0">
                                <p className="text-slate-700 text-sm leading-relaxed">{opt.content}</p>
                                {opt.note && <p className="text-slate-400 text-xs mt-0.5 italic">Ghi chú: {opt.note}</p>}
                              </div>
                              <div className="flex-shrink-0 flex items-center justify-end min-w-[130px]">
                                {aType === "score1_5" && hasRV && <RatingBadge value={Number(rv)} />}
                                {aType === "single_choice" && hasAv && (
                                  <span className="text-xs bg-primary-50 text-primary-800 border border-primary-200 px-2.5 py-1.5 rounded-full font-medium max-w-[220px] text-right break-words">
                                    {String(av)}
                                  </span>
                                )}
                                {aType === "percentage" && hasAv && (
                                  <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-full">
                                    <i className="pi pi-chart-bar text-xs" />{av}%
                                  </span>
                                )}
                                {aType === "text" && hasAv && (
                                  <span className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg max-w-[220px] text-right break-words">
                                    {String(av)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {(!selectedFeedback.sections || selectedFeedback.sections.length === 0) && (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
                <i className="pi pi-inbox text-4xl text-slate-300 mb-3 block"></i>
                <p className="text-slate-500 font-medium">Không có dữ liệu chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};
