import * as Calendar from 'expo-calendar';
import * as Brightness from 'expo-brightness';
import { clamp } from 'react-native-reanimated';
import { ToolCall } from 'react-native-executorch/lib/typescript/types/llm';
import { Platform } from 'react-native';

export const executeTool: (
  call: ToolCall
) => Promise<string | undefined> = async (call) => {
  switch (call.toolName) {
    case 'brightness':
      console.log('Changing brightness!');
      console.log(call.arguments);
      if (
        'targetBrightness' in call.arguments &&
        typeof call.arguments.targetBrightness === 'number'
      ) {
        await Brightness.setBrightnessAsync(
          call.arguments.targetBrightness / 100
        );
      } else if (
        'relativeChange' in call.arguments &&
        typeof call.arguments.relativeChange === 'number'
      ) {
        await Brightness.setBrightnessAsync(
          clamp(
            (await Brightness.getBrightnessAsync()) +
              call.arguments.relativeChange / 100,
            0,
            1
          )
        );
      }
      return undefined;
    case 'read_calendar':
      console.log('Reading calendar!');
      console.log(call);
      console.log(call.arguments);
      if (
        ('timeStart' in call.arguments &&
          typeof call.arguments.timeStart === 'string' &&
          'timeEnd' in call.arguments &&
          typeof call.arguments.timeEnd === 'string') ||
        (!('timeStart' in call.arguments) && !('timeEnd' in call.arguments))
      ) {
        let startTime = Date.parse(
          'timeStart' in call.arguments &&
            typeof call.arguments.timeStart === 'string'
            ? call.arguments.timeStart
            : ''
        );
        let endTime = Date.parse(
          'timeEnd' in call.arguments &&
            typeof call.arguments.timeEnd === 'string'
            ? call.arguments.timeEnd
            : ''
        );
        if (startTime === endTime) {
          // default to today
          let date;
          if (Number.isNaN(startTime)) {
            date = new Date();
          } else {
            date = new Date(startTime);
          }
          // Set the time to 00:00:00.000 for the start of the day
          startTime = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0
          ).valueOf();

          // Set the time to 23:59:59.999 for the end of the day
          endTime = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            23,
            59,
            59
          ).valueOf();
        } else if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
          if (Number.isNaN(startTime)) {
            const endDay = new Date(endTime);
            startTime = new Date(
              endDay.getFullYear(),
              endDay.getMonth(),
              endDay.getDate(),
              0,
              0,
              0
            ).valueOf();
          } else if (Number.isNaN(endTime)) {
            const startDay = new Date(startTime);

            endTime = new Date(
              startDay.getFullYear(),
              startDay.getMonth(),
              startDay.getDate(),
              23,
              59,
              59
            ).valueOf();
          }
        }
        console.log(startTime, endTime);
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        console.log(startDate, endDate);
        const calendars = await Calendar.getCalendarsAsync(
          Platform.OS === 'ios' ? Calendar.EntityTypes.EVENT : undefined
        );
        console.log(calendars);
        const events = await Calendar.getEventsAsync(
          calendars.map((calendar) => calendar.id),
          startDate,
          endDate
        );

        const eventsStringRepresentation = events.map(
          (event) =>
            `${event.title}, from: ${event.startDate}, to: ${event.endDate}`
        );
        console.log(events);
        console.log(eventsStringRepresentation);
        return eventsStringRepresentation.join('\n');
      }
      return undefined;
    case 'add_event_to_calendar':
      console.log('Adding to calendar!');

      return undefined;
    default:
      console.log(`Wrong function! We don't handle it!`);
      return undefined;
    // case 'get_contacts':
    //   console.log('Getting your phone contacts');
    //   const contacts = (
    //     await Contacts.getContactsAsync({
    //       fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    //       name:
    //         'name' in call.arguments &&
    //         typeof call.arguments.name === 'string' &&
    //         call.arguments.name !== ''
    //           ? call.arguments.name
    //           : undefined,
    //     })
    //   ).data
    //     .map((contact) => ({
    //       name: contact.name,
    //       phoneNumber:
    //         contact.phoneNumbers && contact.phoneNumbers.length > 0
    //           ? contact.phoneNumbers[0].number
    //           : 'No number',
    //     }))
    //     .filter(({ phoneNumber }) => {
    //       return phoneNumber?.includes(
    //         'phoneNumberPrefix' in call.arguments &&
    //           typeof call.arguments.phoneNumberPrefix === 'string'
    //           ? call.arguments.phoneNumberPrefix
    //           : ''
    //       );
    //     });
    //
    // const contactsString = contacts
    //   .map((contact) => `${contact.name}: ${contact.phoneNumber}`)
    //   .join('\n');

    // console.log('contact string:', contactsString);

    // return contactsString;
    // case 'send_sms':
    //   console.log('Sending an SMS for you');
    //   await SMS.sendSMSAsync(
    //     [
    //       'to' in call.arguments && typeof call.arguments.to === 'string'
    //         ? call.arguments.to
    //         : 'No number',
    //     ],
    //     'body' in call.arguments && typeof call.arguments.body === 'string'
    //       ? call.arguments.body
    //       : ''
    //   );
    //   break;
  }
};

export const TOOL_DEFINITIONS_PHONE = [
  {
    name: 'brightness',
    description:
      'Change screen brightness. Change can be relative (higher/lower) or set to minimal or maximal.',
    parameters: {
      type: 'dict',
      properties: {
        relativeChange: {
          type: 'number',
          description:
            'Relative change of brightness (from 0 to 100). Change should be negative if user asks for less bright screen.',
        },
        targetBrightness: {
          type: 'number',
          description: 'Relative change of brightness (from 0 to 100).',
        },
      },
    },
  },
  {
    name: 'read_calendar',
    description:
      'Read calendar events from now up to given point in time. If nothing is specified leave both empty.',
    parameters: {
      type: 'dict',
      properties: {
        timeStart: {
          type: 'string',
          description: 'Date and time from which we want to read calendar.',
        },
        timeEnd: {
          type: 'string',
          description: 'Date and time to which we want to read calendar.',
        },
      },
      required: [],
    },
  },
  {
    name: 'add_event_to_calendar',
    description: 'Schedules event in your calendar at given time.',
    parameters: {
      type: 'dict',
      properties: {
        time: {
          type: 'string',
          description: 'Date and time of an event.',
        },
        title: {
          type: 'string',
          description: 'Title of an event',
        },
        description: {
          type: 'string',
          description: 'Description of an event',
        },
      },
      required: ['time', 'title'],
    },
  },
];
