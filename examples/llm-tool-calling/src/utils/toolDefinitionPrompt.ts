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
    name: 'get_contacts',
    description:
      'Gets user phone contacts. Returns both name and phone number.',
    parameters: {
      type: 'dict',
      properties: {
        name: {
          type: 'string',
          description:
            'Full or partial name of person to retrieve. Those will be some part of names or letters, not numbers.',
        },
        phoneNumberPrefix: {
          type: 'string',
          description:
            'Prefix or part of phone number of contact to retrieve. Those will be numbers.',
        },
      },
    },
  },
  {
    name: 'send_sms',
    description: 'Sends SMS/text message to specified user.',
    parameters: {
      type: 'dict',
      properties: {
        to: {
          type: 'string',
          description: 'The recipient phone number.',
        },
        body: {
          type: 'string',
          description: 'Body of the text message.',
        },
      },
      required: ['to', 'body'],
    },
  },
  {
    name: 'read_calendar',
    description: 'Read calendar events from now up to given point in time',
    parameters: {
      type: 'dict',
      properties: {
        time: {
          type: 'string',
          description: 'Date and time to which we want to read calendar',
        },
      },
      required: ['time'],
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
  {
    name: 'flashlight',
    description: 'Turns the flashlight on/off',
    parameters: {
      type: 'dict',
      properties: {
        turn_on: {
          type: 'boolean',
          description: 'Turns the flashlight on.',
        },
        turn_off: {
          type: 'boolean',
          description: 'Turns the flashlight off.',
        },
      },
      required: ['turn_on', 'turn_off'],
    },
  },
];
