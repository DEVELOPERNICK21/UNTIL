//
//  WidgetBridge.m
//  UNTIL
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, NSObject)
RCT_EXTERN_METHOD(setWidgetCache:(NSString *)json)
RCT_EXTERN_METHOD(setCustomCounters:(NSString *)json)
RCT_EXTERN_METHOD(setCountdowns:(NSString *)json)
RCT_EXTERN_METHOD(setDailyTasksStats:(NSString *)json)
RCT_EXTERN_METHOD(getCustomCountersFromAppGroup:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getWidgetStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
