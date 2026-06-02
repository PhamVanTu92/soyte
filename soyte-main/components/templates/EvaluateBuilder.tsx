import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { GroupNode, OptionNode } from '../../types/templates';
import { getGroupIndexString, getOptionIndexString } from '../../utils/templateUtils';

interface EvaluateBuilderProps {
  data: GroupNode[];
  expandedGroups: Record<number, boolean>;
  groupStartIndices: number[];
  toggleGroup: (index: number) => void;
  updateGroup: (index: number, field: keyof GroupNode, val: any) => void;
  removeGroup: (index: number) => void;
  addOption: (groupIndex: number) => void;
  updateOption: (groupIndex: number, optionIndex: number, field: keyof OptionNode, val: any) => void;
  removeOption: (groupIndex: number, optionIndex: number) => void;
  addAnswerOption: (groupIndex: number, optionIndex: number) => void;
  updateAnswerOption: (groupIndex: number, optionIndex: number, ansIdx: number, val: string) => void;
  removeAnswerOption: (groupIndex: number, optionIndex: number, ansIdx: number) => void;
}

export const EvaluateBuilder: React.FC<EvaluateBuilderProps> = ({
  data,
  expandedGroups,
  groupStartIndices,
  toggleGroup,
  updateGroup,
  removeGroup,
  addOption,
  updateOption,
  removeOption,
  addAnswerOption,
  updateAnswerOption,
  removeAnswerOption
}) => {
  return (
    <table className="w-full border-collapse min-w-max text-slate-700">
      <thead className="bg-[var(--primary-color,#003159)] text-white">
        <tr>
          <th className="border border-primary-900 p-3 w-16 text-center align-middle font-semibold bg-primary-800">STT</th>
          <th className="border border-primary-900 p-3 text-center align-middle font-semibold bg-primary-800">Nội dung câu hỏi / đánh giá</th>
          <th className="border border-primary-900 p-3 w-72 text-center align-middle font-semibold bg-primary-800">Loại trả lời & Cấu hình</th>
          <th className="border border-primary-900 p-3 w-28 text-center align-middle font-semibold bg-primary-800">Bắt buộc</th>
          <th className="border border-primary-900 p-3 w-28 text-center align-middle font-semibold bg-primary-800">Trạng thái</th>
          <th className="border border-primary-900 p-3 w-16 text-center align-middle font-semibold bg-primary-800">Xóa</th>
        </tr>
      </thead>
      <tbody>
        {data.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <tr className="bg-primary-50/60 border-b-2 border-primary-200">
              <td className="border border-primary-200 p-2 text-center font-bold text-primary-900 text-base">
                <div className="flex items-center justify-center gap-1">
                  <Button icon={expandedGroups[groupIndex] === false ? "pi pi-chevron-right" : "pi pi-chevron-down"} rounded text className="w-6 h-6 p-0 text-primary-700 hover:bg-primary-100 flex-shrink-0" onClick={() => toggleGroup(groupIndex)} />
                  <span>{getGroupIndexString(groupIndex, group.Roman)}</span>
                </div>
              </td>
              <td colSpan={2} className="border border-primary-200 p-2 font-bold bg-primary-50/60">
                <InputText value={group.name} onChange={(e) => updateGroup(groupIndex, 'name', e.target.value)} className="w-full font-bold bg-transparent border-none shadow-none text-primary-900 placeholder:font-normal p-1 focus:ring-0 focus:bg-white rounded transition-colors" placeholder="Nhập tên nhóm nội dung (ràng buộc tiêu đề I, II, III)..." />
              </td>
              <td className="border border-primary-200 text-center align-middle bg-primary-50/60 p-2">
                <div className="flex justify-center items-center h-full">
                  <InputSwitch checked={group.isValidate || false} onChange={(e) => updateGroup(groupIndex, 'isValidate', e.value)} />
                </div>
              </td>
              <td className="border border-primary-200 text-center align-middle bg-primary-50/60 p-2">
                <div className="flex justify-center items-center h-full">
                  <InputSwitch checked={group.status !== false} onChange={(e) => updateGroup(groupIndex, 'status', e.value)} />
                </div>
              </td>
              <td className="border border-primary-200 p-2 text-center bg-primary-50/60">
                <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => removeGroup(groupIndex)} className="w-8 h-8 flex-shrink-0 bg-white hover:bg-red-50 hover:text-red-600 shadow-sm" />
              </td>
            </tr>
            {expandedGroups[groupIndex] !== false && group.option.map((opt, optIndex) => {
              const globalIdx = groupStartIndices[groupIndex] + optIndex + 1;
              const currentGlobalIndex = getOptionIndexString(groupIndex, optIndex, group.Roman, globalIdx);
              return (
                <tr key={optIndex} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-200 p-2 text-center text-slate-600 font-medium whitespace-nowrap">{currentGlobalIndex}</td>
                  <td className="border border-slate-200 p-1 bg-white">
                    <InputTextarea value={opt.content} onChange={(e) => updateOption(groupIndex, optIndex, 'content', e.target.value)} className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none" autoResize placeholder="Nhập nội dung câu hỏi..." />
                  </td>
                  <td className="border border-slate-200 p-2 bg-white align-top">
                    <Dropdown value={opt.answerType || 'score1_5'} options={[
                      { label: 'Điểm 1-5 (có 0)', value: 'score1_5' },
                      { label: 'Chọn 1 đáp án', value: 'single_choice' },
                      { label: 'Điền phần trăm (%)', value: 'percentage' },
                      { label: 'Văn bản tự do', value: 'text' },
                    ]} onChange={(e) => updateOption(groupIndex, optIndex, 'answerType', e.value)} className="w-full text-sm font-medium" />
                    {opt.answerType === 'single_choice' && (
                      <div className="mt-2 bg-slate-50 p-2 border border-slate-200 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-600">Các đáp án:</span>
                          <Button icon="pi pi-plus" size="small" rounded text onClick={() => addAnswerOption(groupIndex, optIndex)} className="w-6 h-6 p-0 text-primary-600" />
                        </div>
                        <div className="flex flex-col gap-2">
                          {(opt.answerOptions || []).map((ans, ansIdx) => (
                            <div key={ansIdx} className="flex items-center gap-1">
                              <InputText value={ans.value} onChange={(e) => updateAnswerOption(groupIndex, optIndex, ansIdx, e.target.value)} className="w-full p-1 text-xs border-slate-300" placeholder="Nội dung đáp án" />
                              <Button icon="pi pi-times" rounded text severity="danger" onClick={() => removeAnswerOption(groupIndex, optIndex, ansIdx)} className="w-6 h-6 p-0 flex-shrink-0 hover:bg-red-100" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                    <div className="flex justify-center items-center h-full pt-1">
                      <InputSwitch disabled={group.isValidate === false} checked={opt.isValidate || false} onChange={(e) => updateOption(groupIndex, optIndex, 'isValidate', e.value)} />
                    </div>
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                    <div className="flex justify-center items-center h-full pt-1">
                      <InputSwitch disabled={group.status === false} checked={opt.status} onChange={(e) => updateOption(groupIndex, optIndex, 'status', e.value)} />
                    </div>
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                    <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => removeOption(groupIndex, optIndex)} className="w-8 h-8 p-0 hover:bg-red-50" />
                  </td>
                </tr>
              );
            })}
            {expandedGroups[groupIndex] !== false && (
              <tr className="bg-white">
                <td className="border border-slate-200 p-2"></td>
                <td colSpan={5} className="border border-slate-200 p-3 bg-slate-50/30">
                  <Button label="Thêm câu hỏi mới" icon="pi pi-plus" size="small" onClick={() => addOption(groupIndex)} className="bg-white text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-400 font-medium shadow-sm w-fit transition-all" />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};
