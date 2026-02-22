"use client";

import { fetchServices } from "@/utils/fetchServices";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import SubscriptionBenefits from "../subscription/SubscriptionBenefits";

import { Service } from "@/types/booking";



interface GroupedServices {
    [categoryName: string]: Service[];
}

const CategoryBoard = ({ 
    categoryName, 
    services, 
    selectedService, 
    onServiceSelect 
}: { 
    categoryName: string, 
    services: Service[], 
    selectedService: Service | null,
    onServiceSelect: (service: Service) => void 
}) => {
    return (
        <div className="w-full bg-transparent flex flex-col gap-0 text-white">
            <div className="w-full px-4 py-[10px]">
                <h2 className="text-[20px] font-medium leading-[28px]">
                    {categoryName}
                </h2> 
            </div>
            <div className="w-full flex flex-col gap-2 py-2 overflow-y-auto">
                {services.map((service, index) => (
                    <ServiceCard 
                        key={index} 
                        service={service} 
                        isSelected={selectedService?.id === service.id}
                        onSelect={() => onServiceSelect(service)}
                    />
                ))}
            </div>
        </div>
    );
};

export default function ServicesList({
    selectedService,
    onServiceSelect,
    onNext
}: {
    selectedService?: Service | null,
    onServiceSelect?: (service: Service) => void,
    onNext?: () => void
}){
    const [services, setServices] = useState<Service[] | null>(null)

    useEffect(() => {
        fetchServices()
        .then(data => setServices(data))
        .catch(error => console.error('Error fetching services:', error));
    }, [])

    const groupedServices: GroupedServices = {};
    
    if (services) {
        services.forEach(service => {
            const categoryName = service.category_name || 'Без категории';
            if (!groupedServices[categoryName]) {
                groupedServices[categoryName] = [];
            }
            groupedServices[categoryName].push(service);
        });
    }

    return (
        <div className="w-full bg-transparent flex flex-col gap-6 mt-4">
            <div className="px-4">
                <SubscriptionBenefits 
                    serviceId={selectedService?.id}
                />
            </div>
            
            {Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
                <CategoryBoard 
                    key={categoryName} 
                    categoryName={categoryName} 
                    services={categoryServices}
                    selectedService={selectedService || null}
                    onServiceSelect={onServiceSelect || (() => {})}
                />
            ))}
            
            {selectedService && onNext && (
                <div className="w-full px-4 pb-4">
                    <button 
                        onClick={onNext}
                        className="w-full bg-[#7CB895] text-white py-3 rounded-[16px] font-medium text-[16px]"
                    >
                        <span className="font-montserrat">Далее</span>
                    </button>
                </div>
            )}
        </div>
    );
}


const getCategoryBadgeVariant = (categoryId: number) => {
    const variants = ["secondary", "destructive", "default"] as const;
    return variants[categoryId % variants.length];
};

const formatServiceName = (name: string) => {
    const parts = name.split(' + ');
    if (parts.length > 1) {
        return {
            firstLine: parts[0],
            secondLine: parts.slice(1).join(' + ')
        };
    }
    return {
        firstLine: name,
        secondLine: null
    };
};

export function ServiceCard({ 
    service, 
    isSelected = false, 
    onSelect 
}: { 
    service: Service, 
    isSelected?: boolean, 
    onSelect?: () => void 
}) {
    const nameFormatted = formatServiceName(service.name);
    
    return (
        <div 
            className={`w-full flex flex-col rounded-[16px] p-4 min-h-[100px] cursor-pointer transition-colors ${
                isSelected 
                    ? 'bg-[#7CB895] bg-opacity-20 border-2 border-[#7CB895]' 
                    : 'bg-[#000000] border-2 border-transparent hover:border-[#7CB895] hover:border-opacity-50'
            }`}
            onClick={onSelect}
        >
            <div className="flex items-start justify-between gap-3 flex-1">
                <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-medium leading-[20px]">
                        <div className="text-white">
                            {nameFormatted.firstLine}
                        </div>
                        {nameFormatted.secondLine && (
                            <div className="text-[#888888]">
                                {nameFormatted.secondLine}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <span className="text-[#7CB895] text-[16px] font-semibold">
                        {service.pl_price}pln
                    </span>
                </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
                <p className="text-[#BBBDC0] text-[14px]">
                    {service.duration}min
                </p>
                <Badge 
                    variant={getCategoryBadgeVariant(service.category_id || 0)}
                    className="text-xs"
                >
                    {service.category_name}
                </Badge>
            </div>
        </div>
    )
}


