import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { GroupNode, OptionNode } from '../../types/templates';
import { getGroupIndexString, getOptionIndexString } from '../../utils/templateUtils';

interface ReflectBuilderProps {
  data: GroupNode[];
  expandedGroups: Record<number, boolean>;
  groupStartIndices: number[];
  toggleGroup: (index: number) => void;
  updateGroup: (index: number, field: keyof GroupNode, val: any) => void;
  removeGroup: (index: number) => void;
  addOption: (groupIndex: number) => void;
  updateOption: (groupIndex: number, optionIndex: number, field: keyof OptionNode, val: any) => void;
  removeOption: (groupIndex: number, optionIndex: number) => void;
}

export const ReflectBuilder: React.FC<ReflectBuilderProps> = ({
  data,
  expandedGroups,
  groupStartIndices,
  toggleGroup,
  updateGroup,
  removeGroup,
  addOption,
  updateOption,
  removeOption
}) => {
  return (
    <table className="w-full border-collapse min-w-max text-slate-700">
      <thead className="bg-[var(--primary-color,#003159)] text-white">
        <tr>
          <th rowSpan={2} className="border border-primary-900 p-3 w-12 text-center align-middle font-semibold bg-primary-800">STT</th>
          <th rowSpan={2} className="border border-primary-900 p-3 min-w-[200px] text-center align-middle font-semibold bg-primary-800">Nội dung thực hiện</th>
          <th rowSpan={2} className="border border-primary-900 p-3 min-w-[200px] text-center align-middle font-semibold bg-primary-800">Phương thức thực hiện</th>
          <th rowSpan={2} className="border border-primary-900 p-3 min-w-[150px] text-center align-middle font-semibold bg-primary-800">Sản phẩm đầu ra</th>
          <th colSpan={3} className="border border-primary-900 p-2 text-center align-middle font-semibold bg-primary-800">Tiến độ thực hiện</th>
          <th colSpan={2} className="border border-primary-900 p-2 text-center align-middle font-semibold bg-primary-800">Đánh giá</th>
          <th rowSpan={2} className="border border-primary-900 p-3 w-24 text-center align-middle font-semibold bg-primary-800">Ghi chú/<br />Kiến nghị</th>
          <th rowSpan={2} className="border border-primary-900 p-3 w-28 text-center align-middle font-semibold bg-primary-800">Bắt buộc</th>
          <th rowSpan={2} className="border border-primary-900 p-3 w-28 text-center align-middle font-semibold bg-primary-800">Trạng thái</th>
          <th rowSpan={2} className="border border-primary-900 p-3 w-16 text-center align-middle font-semibold bg-primary-800">Xóa</th>
        </tr>
        <tr>
          <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Đã thực hiện</th>
          <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Đang thực hiện</th>
          <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Chưa thực hiện</th>
          <th className="border border-primary-900 p-2 w-20 text-center align-middle font-medium text-xs bg-primary-800">Đạt</th>
          <th className="border border-primary-900 p-2 w-20 text-center align-middle font-medium text-xs bg-primary-800">Không đạt</th>
        </tr>
      </thead>
      <tbody>
        {data.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <tr className="bg-primary-50/60 border-b-2 border-primary-200">
              <td className="border border-primary-200 p-2 text-center font-bold text-primary-900 text-base">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    icon={expandedGroups[groupIndex] === false ? "pi pi-chevron-right" : "pi pi-chevron-down"}
                    rounded text
                    className="w-6 h-6 p-0 text-primary-700 hover:bg-primary-100 flex-shrink-0"
                    onClick={() => toggleGroup(groupIndex)}
                  />
                  <span>{getGroupIndexString(groupIndex, group.Roman)}</span>
                </div>
              </td>
              <td colSpan={8} className="border border-primary-200 p-2 font-bold bg-primary-50/60">
                <InputText
                  value={group.name}
                  onChange={(e) => updateGroup(groupIndex, 'name', e.target.value)}
                  className="w-full font-bold bg-transparent border-none shadow-none text-primary-900 placeholder:font-normal p-1 focus:ring-0 focus:bg-white rounded transition-colors"
                  placeholder="Nhập tên nhóm nội dung"
                />
              </td>
              <td className="border border-primary-200 bg-primary-50/60"></td>
              <td className="border border-primary-200 text-center align-middle bg-primary-50/60 p-2">
                <div className="flex justify-center items-center h-full">
                  <InputSwitch
                    checked={group.isValidate || false}
                    onChange={(e) => updateGroup(groupIndex, 'isValidate', e.value)}
                  />
                </div>
              </td>
              <td className="border border-primary-200 text-center align-middle bg-primary-50/60 p-2">
                <div className="flex justify-center items-center h-full">
                  <InputSwitch
                    checked={group.status !== false}
                    onChange={(e) => updateGroup(groupIndex, 'status', e.value)}
                  />
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
                  <td className="border border-slate-200 p-2 text-center text-slate-600 font-medium">{currentGlobalIndex}</td>
                  <td className="border border-slate-200 p-1 bg-white">
                    <InputTextarea
                      value={opt.content}
                      onChange={(e) => updateOption(groupIndex, optIndex, 'content', e.target.value)}
                      className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none"
                      autoResize
                      placeholder="Nhập nội dung"
                    />
                  </td>
                  <td className="border border-slate-200 p-1 bg-white">
                    <InputTextarea
                      value={opt.method}
                      onChange={(e) => updateOption(groupIndex, optIndex, 'method', e.target.value)}
                      className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none"
                      autoResize
                      placeholder="Phương thức thực hiện"
                    />
                  </td>
                  <td className="border border-slate-200 p-1 bg-white">
                    <InputTextarea
                      value={opt.productOut}
                      onChange={(e) => updateOption(groupIndex, optIndex, 'productOut', e.target.value)}
                      className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none"
                      autoResize
                      placeholder="Sản phẩm đầu ra"
                    />
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                    <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-primary-600" />
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                    <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-primary-600" />
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                    <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-primary-600" />
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/30">
                    <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-green-600" />
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/30">
                    <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-red-600" />
                  </td>
                  <td className="border border-slate-200 p-1 bg-white">
                    <InputTextarea className="w-full min-h-[3rem] border-transparent text-slate-400 p-2 bg-transparent resize-none" disabled placeholder="Ghi chú" />
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                    <div className="flex justify-center items-center h-full pt-1">
                      <InputSwitch
                        disabled={group.isValidate === false}
                        checked={opt.isValidate || false}
                        onChange={(e) => updateOption(groupIndex, optIndex, 'isValidate', e.value)}
                      />
                    </div>
                  </td>
                  <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                    <div className="flex justify-center items-center h-full pt-1">
                      <InputSwitch
                        disabled={group.status === false}
                        checked={opt.status}
                        onChange={(e) => updateOption(groupIndex, optIndex, 'status', e.value)}
                      />
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
                <td colSpan={11} className="border border-slate-200 p-3 bg-slate-50/30">
                  <Button
                    label="Thêm dòng nội dung mới"
                    icon="pi pi-plus"
                    size="small"
                    onClick={() => addOption(groupIndex)}
                    className="bg-white text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-400 font-medium shadow-sm w-fit transition-all"
                  />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};
