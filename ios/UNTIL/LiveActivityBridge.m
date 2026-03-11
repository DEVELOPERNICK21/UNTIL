//
//  LiveActivityBridge.m
//  UNTIL
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityBridge, NSObject)
RCT_EXTERN_METHOD(startActivity:(NSString *)stateJson)
RCT_EXTERN_METHOD(updateActivity:(NSString *)stateJson)
RCT_EXTERN_METHOD(endActivity)
RCT_EXTERN_METHOD(isActivityActive:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
