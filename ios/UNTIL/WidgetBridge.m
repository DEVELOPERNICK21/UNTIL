//
//  WidgetBridge.m
//  UNTIL
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, NSObject)
RCT_EXTERN_METHOD(setWidgetCache:(NSString *)json)
RCT_EXTERN_METHOD(getWidgetStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
