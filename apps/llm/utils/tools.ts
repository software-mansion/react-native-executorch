import * as Calendar from 'expo-calendar';
import * as Brightness from 'expo-brightness';
import { clamp } from 'react-native-reanimated';
import { Platform } from 'react-native';
import { ToolCall } from 'react-native-executorch';

export const executeTool: (call: ToolCall) => Promise<string | null> = async (
  call
) => {
  switch (call.toolName) {
    case 'brightness':
      return await brightness(call);
    case 'read_calendar':
      return await readCalendar(call);
    case 'add_event_to_calendar':
      return await addEventToCalendar(call);
    default:
      console.error(`Wrong function! We don't handle it!`);
      return null;
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
      },
      required: ['time', 'title'],
    },
  },
];

const brightness = async (call: ToolCall) => {
  console.log('Changing brightness!', call);
  if (
    'targetBrightness' in call.arguments &&
    typeof call.arguments.targetBrightness === 'number'
  ) {
    await Brightness.setBrightnessAsync(call.arguments.targetBrightness / 100);
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
  return null;
};

const readCalendar = async (call: ToolCall) => {
  console.log('Reading calendar!', call);

  let startTime = Date.parse(
    'timeStart' in call.arguments &&
      typeof call.arguments.timeStart === 'string'
      ? call.arguments.timeStart
      : ''
  );
  let endTime = Date.parse(
    'timeEnd' in call.arguments && typeof call.arguments.timeEnd === 'string'
      ? call.arguments.timeEnd
      : ''
  );

  if (
    startTime === endTime ||
    (Number.isNaN(startTime) && Number.isNaN(endTime))
  ) {
    // default to today for empty function calls
    let date;
    if (Number.isNaN(startTime)) {
      date = new Date();
    } else {
      date = new Date(startTime);
    }
    // Set the time to 00:00:00 for the start of the day
    startTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0
    ).valueOf();

    // Set the time to 23:59:59 for the end of the day
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
      const today = new Date();
      startTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0
      ).valueOf();
    } else if (Number.isNaN(endTime)) {
      const today = new Date();

      endTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      ).valueOf();
    }
  }
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const calendars = await Calendar.getCalendarsAsync(
    Platform.OS === 'ios' ? Calendar.EntityTypes.EVENT : undefined
  );
  const events = await Calendar.getEventsAsync(
    calendars.map((calendar) => calendar.id),
    startDate,
    endDate
  );

  const eventsStringRepresentation = events.map(
    (event) => `${event.title}, from: ${event.startDate}, to: ${event.endDate}`
  );
  return eventsStringRepresentation.join('\n');
};

const addEventToCalendar = async (call: ToolCall) => {
  console.log('Adding event to calendar!', call);
  if (
    'time' in call.arguments &&
    typeof call.arguments.time === 'string' &&
    'title' in call.arguments &&
    typeof call.arguments.title === 'string'
  ) {
    const calendars = await Calendar.getCalendarsAsync(
      Platform.OS === 'ios' ? Calendar.EntityTypes.EVENT : undefined
    );
    let startDate = new Date(Date.parse(call.arguments.time));
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    await Calendar.createEventAsync(calendars[0].id, {
      title: call.arguments.title,
      startDate: startDate,
      endDate: endDate,
    });
  }
  return null;
};
