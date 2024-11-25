#import "ConversationManager.h"

@implementation ConversationManager

- (instancetype)initWithNumMessagesContextWindow:(NSUInteger)numMessages
                                     systemPrompt:(NSString *)systemPrompt {
    self = [super init];
    if (self) {
        numMessagesContextWindow = numMessages;
        basePrompt += std::string(BEGIN_OF_TEXT_TOKEN);
        basePrompt += [self getHeaderTokenFromRole:ChatRole::SYSTEM];
        basePrompt += [systemPrompt UTF8String];
        basePrompt += std::string(END_OF_TEXT_TOKEN);
        basePrompt += [self getHeaderTokenFromRole:ChatRole::USER];
    }
    return self;
}

- (void)addResponse:(NSString *)text senderRole:(ChatRole)senderRole {
    if (messages.size() >= numMessagesContextWindow) {
        messages.pop_front();
    }
    
    std::string formattedMessage;
    if (senderRole == ChatRole::ASSISTANT) {
        formattedMessage = [text UTF8String];
        formattedMessage += [self getHeaderTokenFromRole:ChatRole::USER];
    } else {
        formattedMessage += [text UTF8String];
        formattedMessage += std::string(END_OF_TEXT_TOKEN);
        formattedMessage += [self getHeaderTokenFromRole:ChatRole::ASSISTANT];
    }
    messages.push_back(formattedMessage);
}

- (NSString *)getConversation {
    std::string prompt = basePrompt;
    for (const auto& elem : messages) {
        prompt += elem;
    }
    return [NSString stringWithUTF8String:prompt.c_str()];
}

- (std::string)getHeaderTokenFromRole:(ChatRole)role {
    switch (role) {
        case ChatRole::SYSTEM:
            return std::string(START_HEADER_ID_TOKEN) + "system" + std::string(END_HEADER_ID_TOKEN);
        case ChatRole::USER:
            return std::string(START_HEADER_ID_TOKEN) + "user" + std::string(END_HEADER_ID_TOKEN);
        case ChatRole::ASSISTANT:
            return std::string(START_HEADER_ID_TOKEN) + "assistant" + std::string(END_HEADER_ID_TOKEN);
        default:
            return "";
    }
}

@end
