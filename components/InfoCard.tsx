
import React from 'react';

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md mb-4">
      <div className="bg-blue-50 px-4 py-3 flex items-center gap-2 border-b border-blue-100">
        <span className="text-blue-600">{icon}</span>
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};
