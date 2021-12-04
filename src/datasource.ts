import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { Observable } from 'rxjs';
import { cloneDeep, defaults } from 'lodash';

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    return new Observable(subscriber => {
      subscriber.next(this.multiFrame(this.sceneDialogueVsAction(request)));
    });
  }

  private multiFrame(response: DataQueryResponse): DataQueryResponse {
    const frame = response.data[0];
    for (let i = 0; i < 5; i++) {
      const clone = cloneDeep(frame as MutableDataFrame);
      clone.refId = 'BCDEFGH'[i];
      clone.name += '(' + clone.refId + ')';
      response.data.push(clone);
    }
    return response;
  }

  /**
   * State timeline
   */
  private status(request: DataQueryRequest): DataQueryResponse {
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
    return { data };
  }

  private ranking(request: DataQueryRequest): DataQueryResponse {
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
    return { data };
  }

  private talkers(request: DataQueryRequest): DataQueryResponse {
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

    return { data: [nodes, edges] };
  }

  private sentiment(request: DataQueryRequest): DataQueryResponse {
    const data = [];
    const frame = new MutableDataFrame({
      refId: 'A',
      name: 'MY SCREENPLAY by That Guy',
      fields: [
        { name: 'minute', values: [], type: FieldType.time },
        { name: 'sentiment', values: [], type: FieldType.number },
      ],
    });
    console.log(request.range!.from.valueOf());
    console.log(request.range!.to.valueOf());
    for (let i = 1; i < 150; i++) {
      frame.add({ minute: i * 60 * 1000, sentiment: (Math.random() - 0.5) * 2 });
    }
    data.push(frame);
    return { data };
  }

  private sceneDialogueVsAction(request: DataQueryRequest): DataQueryResponse {
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
    return { data };
  }

  private daysNightsBreakdown(request: DataQueryRequest): DataQueryResponse {
    const data = [];
    const frame = new MutableDataFrame({
      refId: 'A',
      fields: [
        { name: 'days', values: [], type: FieldType.number },
        { name: 'nights', values: [], type: FieldType.number },
      ],
    });
    frame.add({ days: 10, nights: 20 });
    data.push(frame);
    return { data };
  }

  private sceneLength(request: DataQueryRequest): DataQueryResponse {
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
    return { data };
  }

  private sceneLengthBreakdown(request: DataQueryRequest): DataQueryResponse {
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
    return { data };
  }

  private sceneLengthBig(request: DataQueryRequest): DataQueryResponse {
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
    return { data };
  }

  private sceneLengthByLocation(request: DataQueryRequest): DataQueryResponse {
    const data = [];
    const frame = new MutableDataFrame({
      refId: 'A',
      fields: [
        { name: 'scene', values: [], type: FieldType.string },
        { name: 'length', values: [], type: FieldType.number },
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
    return { data };
  }

  private testData(options: DataQueryRequest): DataQueryResponse {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // duration of the time range, in milliseconds.
    const resolution = 10;
    const frequency = 0.5;
    const duration = to - from;

    // step determines how close in time (ms) the points will be to each other.
    const step = duration / resolution;

    // Return a constant for each query.
    const data = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      const frame = new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'time', values: [], type: FieldType.time },
          { name: 'series1', values: [], type: FieldType.number },
          { name: 'series2', values: [], type: FieldType.number },
        ],
      });
      for (let t = 0; t <= duration; t += step) {
        frame.add({ time: from + t, series1: Math.sin((2 * Math.PI * frequency * t) / duration), series2: null });
      }
      for (let t = 0; t <= duration; t += step / 3) {
        frame.add({
          time: from + t,
          series1: null,
          series2: Math.sin((((2 * Math.PI * frequency) / 2) * t) / duration),
        });
      }
      return frame;
    });

    return { data };
  }
}
