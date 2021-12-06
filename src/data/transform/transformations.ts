import { DataFrame, FieldColorModeId, FieldType, MutableDataFrame } from '@grafana/data';
import { GraphDrawStyle } from '@grafana/schema';
import { default as awParser } from 'aw-parser';
import { default as awLiner } from 'aw-liner';
import { getPrintProfiles } from '../screenplay/printProfile';
import { theTrialOfTheChicago7 } from '../screenplay/the-trial-of-the-chicago-7';
import { createDaysAndNights, createSceneLength } from '../../fountain/queries';

export type FountainToFrameTransformation = (content?: string) => DataFrame[];

/**
 * Viz: bar chart
 */
export const sceneLengthByLocation: FountainToFrameTransformation = () => {
  const data = [];
  const config = {
    color: {
      mode: FieldColorModeId.Fixed,
      fixedColor: '#990000',
    },
    custom: {
      drawStyle: GraphDrawStyle.Bars,
    },
  };
  const frame = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'scene', values: [], type: FieldType.string },
      { name: 'length', values: [], type: FieldType.number, config },
    ],
  });
  frame.add({ scene: 'OPENING TITLES', length: 3 });
  frame.add({ scene: 'EXT. SKYSCRAPER - NIGHT', length: 2.4 });
  frame.add({ scene: 'INT. COPY ROOM - NIGHT', length: 1.2 });
  frame.add({ scene: 'INT. HALLWAY - NIGHT', length: 0.5 });
  frame.add({ scene: 'INT. OFFICE - NIGHT', length: 3.1 });
  frame.add({ scene: 'EXT. STREET - DAY', length: 5.2 });
  frame.add({ scene: 'EXT. CAR - DAY', length: 4.1 });
  frame.add({ scene: 'SNIPER SCOPE POV', length: 0.2 });
  frame.add({ scene: "EXT. BRICK'S PATIO - DAY", length: 1.2 });
  frame.add({ scene: 'INT. TRAILER HOME - DAY', length: 1.2 });
  frame.add({ scene: "EXT. BRICK'S POOL - DAY", length: 1.9 });
  frame.add({ scene: 'EXT. WOODEN SHACK - DAY', length: 0.2 });
  data.push(frame);

  return data;
};

const parseTestScreenplay = (content?: string) => {
  const screenplay = content ? content : theTrialOfTheChicago7;
  const config = {
    print_headers: true,
    print_actions: true,
    print_dialogues: true,
    print_notes: false,
    print_sections: false,
    print_synopsis: false,
    each_scene_on_new_page: false,
    double_space_between_scenes: false,
    use_dual_dialogue: true,
    merge_multiple_empty_lines: true,
  };
  const parsed = awParser.parser.parse(screenplay, config);
  const liner = new awLiner.Liner(awParser.helpers);

  const lines = liner.line(parsed.tokens, {
    print: getPrintProfiles().usletter,
    text_more: '(MORE)',
    text_contd: "(CONT'D)",
    split_dialogue: true,
  });

  return { parsed, lines };
};

export const test: FountainToFrameTransformation = (content?: string) => {
  const { parsed } = parseTestScreenplay(content);
  const queryRunner = createDaysAndNights();
  const result = queryRunner.run(parsed.tokens, true).filter(r => r.value);

  const fields = result.map(({ label }) => {
    return { name: label, values: [], type: FieldType.number };
  });

  const frame = new MutableDataFrame({
    refId: 'A',
    fields,
  });

  let fieldValue = result.reduce((prev, current) => {
    prev[current.label] = current.value;
    return prev;
  }, {});
  frame.add(fieldValue);

  return [frame];
};

export const test2: FountainToFrameTransformation = (content?: string) => {
  const { parsed } = parseTestScreenplay(content);
  const queryRunner = createSceneLength();
  const result = queryRunner.run(parsed.tokens, true);
  console.log(result);

  const frame = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'scene', values: [], type: FieldType.string },
      { name: 'length', values: [], type: FieldType.number },
    ],
  });

  result.forEach(({ header, length, location_type, type }, index) => {
    frame.add({ scene: '#' + (index + 1).toString(), length });
  });

  return [frame];
};

/**
 * Viz: bar chart
 */
export const sceneLengthBreakdown: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'scene', values: [], type: FieldType.string },
      { name: 'day', values: [], type: FieldType.number },
      { name: 'night', values: [], type: FieldType.number },
    ],
  });
  for (let scene = 1; scene < 15; scene++) {
    const isDay = Math.random() < 0.5;
    const length = Math.random() * 5;
    frame.add({ scene: scene.toFixed(0), day: isDay ? length : 0, night: isDay ? 0 : length });
  }
  data.push(frame);
  return data;
};

/**
 * Viz: state timeline, status history
 */
export const status: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    name: 'MY SCREENPLAY by That Guy',
    fields: [
      { name: 'time', values: [], type: FieldType.time },
      { name: 'location', values: [], type: FieldType.string },
      { name: 'MIKE', values: [], type: FieldType.boolean },
    ],
  });
  for (let i = 0; i < 60000 * 120; i += 60000) {
    frame.add({ time: i, location: 'INT. STREET', MIKE: false });
  }
  // frame.add({ time: 60000 * 1, location: 'INT. STREET', MIKE: false  });
  // frame.add({ time: 60000 * 2, location: 'INT. STREET', MIKE: false  });
  // frame.add({ time: 60000 * 3, location: 'INT. STREET', MIKE: true  });
  // frame.add({ time: 60000 * 10, location: 'INT. STREET', MIKE: false  });
  // frame.add({ time: 60000 * 20, location: 'INT. STREET', MIKE: true  });
  // frame.add({ time: 60000 * 50, location: 'EXT. STREET', MIKE: true });
  // frame.add({ time: 60000 * 80, location: 'EXT. STREET', MIKE: true  });
  // frame.add({ time: 60000 * 100, location: 'INT. STREET', MIKE: false  });

  data.push(frame);
  return data;
};

/**
 * Viz: table
 */
export const ranking: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    name: 'MY SCREENPLAY by That Guy',
    fields: [
      { name: 'name', values: [], type: FieldType.string },
      { name: 'dialogue', values: [], type: FieldType.number },
      { name: 'dialogueF', values: [], type: FieldType.string },
      { name: 'scenes', values: [], type: FieldType.number },
    ],
  });
  frame.add({ name: 'MIKE', dialogue: 2.9, dialogueF: '2:57', scenes: 9 });
  frame.add({ name: 'INTERCOM', dialogue: 1.2, dialogueF: '1:09', scenes: 2 });
  frame.add({ name: 'MINA', dialogue: 0.2, dialogueF: '0:11', scenes: 1 });
  frame.add({ name: 'DONNA', dialogue: 0.19, dialogueF: '0:10', scenes: 1 });
  frame.add({ name: 'PRINTER', dialogue: 0.05, dialogueF: '0:03', scenes: 1 });

  data.push(frame);
  return data;
};

/**
 * Viz: node graph
 */
export const talkers: FountainToFrameTransformation = () => {
  const nodes = new MutableDataFrame({
    refId: undefined,
    fields: [
      { name: 'id', values: [], type: FieldType.string },
      { name: 'title', values: [], type: FieldType.string },
      { name: 'color', values: [], type: FieldType.string },
    ],
  });
  nodes.add({ id: '0', title: 'NAME 1', color: '#999900' });
  nodes.add({ id: '1', title: 'NAME 2', color: '#999900' });
  nodes.add({ id: '2', title: 'LOCATION 1', color: '#1155ff' });
  nodes.add({ id: '3', title: 'LOCATION 2', color: '#1155ff' });

  const edges = new MutableDataFrame({
    refId: undefined,
    fields: [
      { name: 'id', values: [], type: FieldType.string },
      { name: 'source', values: [], type: FieldType.string },
      { name: 'target', values: [], type: FieldType.string },
    ],
  });

  edges.add({ id: '0', source: '0', target: '2' });
  edges.add({ id: '0', source: '2', target: '0' });

  edges.add({ id: '1', source: '2', target: '1' });
  edges.add({ id: '1', source: '1', target: '2' });

  edges.add({ id: '2', source: '3', target: '1' });
  edges.add({ id: '2', source: '1', target: '3' });

  return [nodes, edges];
};

/**
 * Viz: time series
 */
export const sentiment: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    name: 'MY SCREENPLAY by That Guy',
    fields: [
      { name: 'minute', values: [], type: FieldType.time },
      { name: 'sentiment', values: [], type: FieldType.number },
    ],
  });
  for (let i = 1; i < 150; i++) {
    frame.add({ minute: i * 60 * 1000, sentiment: (Math.random() - 0.5) * 2 });
  }
  data.push(frame);
  return data;
};

export const sceneDialogueVsAction: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    name: 'MY SCREENPLAY by That Guy',
    fields: [
      { name: 'scene', values: [], type: FieldType.string },
      { name: 'action', values: [], type: FieldType.number },
      { name: 'dialogue', values: [], type: FieldType.number },
    ],
  });
  for (let scene = 1; scene < 150; scene++) {
    const dialogue = Math.random() * 5;
    const action = Math.random() * 5;
    const total = Math.random() * 5;
    frame.add({ scene: scene.toFixed(0), action, dialogue, total });
  }
  data.push(frame);
  return data;
};

export const daysNightsBreakdown: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    name: 'SCREENPLAY TITLE',
    fields: [
      { name: 'days', values: [], type: FieldType.number },
      { name: 'nights', values: [], type: FieldType.number },
    ],
  });
  frame.add({ days: 10, nights: 20 });
  data.push(frame);
  return data;
};

export const sceneLength: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'scene', values: [], type: FieldType.string },
      { name: 'length', values: [], type: FieldType.number },
    ],
  });
  frame.add({ scene: '1', length: 2.4 });
  frame.add({ scene: '2', length: 1.2 });
  frame.add({ scene: '3', length: 0.5 });
  frame.add({ scene: '4', length: 3.1 });
  frame.add({ scene: '5', length: 5.2 });
  frame.add({ scene: '6', length: 4.1 });
  frame.add({ scene: '7', length: 1.2 });
  frame.add({ scene: '8', length: 1.2 });
  frame.add({ scene: '9', length: 1.9 });
  frame.add({ scene: '10', length: 0.2 });
  frame.add({ scene: '11', length: 3 });
  data.push(frame);
  return data;
};

export const sceneLengthBig: FountainToFrameTransformation = () => {
  const data = [];
  const frame = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'scene', values: [], type: FieldType.string },
      { name: 'length', values: [], type: FieldType.number },
    ],
  });
  for (let scene = 1; scene < 150; scene++) {
    frame.add({ scene: scene.toFixed(0), length: Math.random() * 5 });
  }
  data.push(frame);
  return data;
};

export const Queries: Record<string, FountainToFrameTransformation> = {
  sceneLengthByLocation: sceneLengthByLocation,
  sceneLengthBreakdown: sceneLengthBreakdown,
  status: status,
  ranking: ranking,
  talkers: talkers,
  sentiment: sentiment,
  sceneDialogueVsAction: sceneDialogueVsAction,
  daysNightsBreakdown: daysNightsBreakdown,
  sceneLength: sceneLength,
  sceneLengthBig: sceneLengthBig,
  test,
  test2,
};
