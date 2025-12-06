import React from 'react';
import { Visit } from '../../types';
import { Button } from '../ui/Button';
import { Calendar, User, Paperclip, ChevronRight, Stethoscope } from 'lucide-react';

interface VisitTimelineProps {
  visits: Visit[];
  onViewVisit: (visit: Visit) => void;
  onViewAttachment: (url: string, name: string) => void;
}

export const VisitTimeline: React.FC<VisitTimelineProps> = ({ visits, onViewVisit, onViewAttachment }) => {
  if (visits.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16 bg-white rounded-b-xl border-t-0">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                  <Calendar size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">No medical history found</p>
              <p className="text-sm">Add a new visit to start tracking clinical progress.</p>
          </div>
      );
  }

  return (
    <div className="p-6 bg-white rounded-b-xl border-t-0">
        <div className="relative pl-4 space-y-8">
            {/* Vertical connector line */}
            <div className="absolute top-2 bottom-6 left-[1.65rem] w-0.5 bg-gray-200"></div>
            
            {visits.map((visit, index) => (
                <div key={visit.id} className="relative pl-12 group animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                    {/* Timeline Dot */}
                    <div className="absolute left-4 top-5 h-5 w-5 rounded-full bg-white border-[3px] border-ayur-500 shadow-sm z-10 group-hover:scale-110 group-hover:border-ayur-600 transition-all"></div>
                    
                    {/* Card */}
                    <div className="bg-white rounded-xl p-0 border border-gray-200 shadow-sm hover:shadow-md hover:border-ayur-300 transition-all overflow-hidden">
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-white text-ayur-700 px-3 py-1.5 rounded-md text-sm font-bold border border-ayur-200 shadow-sm">
                                    {visit.date}
                                </div>
                                <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                                <span className="text-sm text-gray-600 flex items-center font-medium">
                                    <User size={14} className="mr-1.5 text-gray-400" /> 
                                    {visit.doctorName}
                                </span>
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-8 bg-white"
                                onClick={() => onViewVisit(visit)}
                            >
                                View Details <ChevronRight size={14} className="ml-1" />
                            </Button>
                        </div>
                        
                        {/* Card Content */}
                        <div className="p-5">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Stethoscope size={16} className="text-ayur-600" />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnosis</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 leading-relaxed bg-gray-50/50 p-2 rounded border border-gray-100/50">
                                        {visit.diagnosis}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-4 w-4 rounded-full bg-ayur-100 flex items-center justify-center text-ayur-700 text-[10px] font-bold">Rx</div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Treatment</span>
                                    </div>
                                    <p className="text-sm text-gray-800 leading-relaxed">
                                        {visit.treatmentPlan}
                                    </p>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                {visit.attachments && visit.attachments.length > 0 ? (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewAttachment(visit.attachments![0], visit.attachments![0]);
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                    >
                                        <Paperclip size={12} className="mr-1.5"/> 
                                        View Attachment
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-400 italic px-2">No attachments</span>
                                )}
                                
                                {visit.notes && (
                                    <span className="text-xs text-gray-500 border-l border-gray-200 pl-3 ml-1 truncate max-w-[250px]">
                                        <span className="font-semibold">Note:</span> {visit.notes}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};