import React from 'react'

interface TablePreviewProps {
    title: string;
    data: any[];
    isAppendix?: boolean;
    type1?: string;
    type2?: string;
    unitLabel?: string;
    tableKey: string;
    expandedTables: Record<string, boolean>;
    toggleTable: (key: string) => void;
}

const headerTongHop = ['TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng', 'TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng'];

const isEmpty = (val: any) =>
    val === 0 || val === "0" || val === "0.00" || val === "0.00%" || val === "";

export const TablePreview = ({
    title, data, isAppendix = false, type1 = '', type2 = '',
    unitLabel = 'Đơn vị', tableKey, expandedTables, toggleTable
}: TablePreviewProps) => {
    const isExpanded = expandedTables[tableKey];

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 mt-6 overflow-hidden">
            <div
                className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleTable(tableKey)}
            >
                <h3 className={`font-bold text-slate-800 text-lg tracking-tight ${isAppendix ? 'text-center flex-1' : ''}`}>{title}</h3>
                <div className="flex items-center gap-2">
                    <i className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} text-slate-500`}></i>
                </div>
            </div>
            {isExpanded && (
                <div className="overflow-x-auto p-4 md:p-6 bg-slate-50">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse border border-slate-300">
                            <thead className="bg-primary-900 text-white uppercase text-xs">
                                {!isAppendix ? (
                                    <>
                                        <tr>
                                            <th rowSpan={2} className="border border-slate-600 p-3 text-center align-middle font-semibold w-12">STT</th>
                                            <th rowSpan={2} className="border border-slate-600 p-3 align-middle font-semibold whitespace-nowrap">{unitLabel}</th>
                                            <th colSpan={3} className="border border-slate-600 p-3 text-center font-semibold">KQ tự khảo sát</th>
                                            <th colSpan={3} className="border border-slate-600 p-3 text-center font-semibold">KQ qua QR của SYT</th>
                                        </tr>
                                        <tr>
                                            {headerTongHop.map((header, idx) => (
                                                <th key={idx} className="border border-slate-600 p-3 text-center font-semibold whitespace-nowrap">{header}</th>
                                            ))}
                                        </tr>
                                    </>
                                ) : (
                                    <>
                                        <tr>
                                            <th rowSpan={3} className="border border-slate-600 p-3 text-center align-middle font-semibold w-12">STT</th>
                                            <th rowSpan={3} className="border border-slate-600 p-3 align-middle font-semibold whitespace-nowrap">{unitLabel}</th>
                                            <th colSpan={4} className="border border-slate-600 p-3 text-center font-semibold">KQ tự khảo sát của đơn vị</th>
                                            <th colSpan={4} className="border border-slate-600 p-3 text-center font-semibold">KQ khảo sát qua QR của SYT</th>
                                        </tr>
                                        <tr>
                                            <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type1}</th>
                                            <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type2}</th>
                                            <th colSpan={2} className="border border-slate-600 p-2 text-center font-semibold">TS phiếu KS</th>
                                            <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type1}</th>
                                            <th rowSpan={2} className="border border-slate-600 p-2 text-center align-middle font-semibold leading-tight">CSHL<br />{type2}</th>
                                            <th colSpan={2} className="border border-slate-600 p-2 text-center font-semibold">TS phiếu KS</th>
                                        </tr>
                                        <tr>
                                            <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type1}</th>
                                            <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type2}</th>
                                            <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type1}</th>
                                            <th className="border border-slate-600 p-2 text-center font-semibold whitespace-nowrap">{type2}</th>
                                        </tr>
                                    </>
                                )}
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAppendix ? 10 : 8} className="p-10 text-center text-slate-400 italic">Không có dữ liệu trong khoảng thời gian này</td>
                                    </tr>
                                ) : data.map((row: any, index: number) => (
                                    <tr key={index} className={`hover:bg-slate-50 border-b border-slate-200 transition-colors ${row.isTotal ? 'font-bold bg-primary-50/50 text-primary-900 border-t-2 border-t-primary-200' : ''}`}>
                                        <td className="border border-slate-300 p-3 text-center font-medium">{row.id}</td>
                                        <td className="border border-slate-300 p-3 whitespace-nowrap text-slate-800">{row.type}</td>
                                        <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col1) ? "" : row.col1}</td>
                                        <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col2) ? "" : row.col2}</td>
                                        <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col3) ? "" : row.col3}</td>
                                        <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col4) ? "" : row.col4}</td>
                                        <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col5) ? "" : row.col5}</td>
                                        <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col6) ? "" : row.col6}</td>
                                        {isAppendix && <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col7) ? "" : row.col7}</td>}
                                        {isAppendix && <td className="border border-slate-300 p-3 text-center text-slate-700">{isEmpty(row.col8) ? "" : row.col8}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablePreview;
