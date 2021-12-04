import { defaults } from 'lodash';

import React, { PureComponent } from 'react';
import { Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { Queries } from './data/transform/transformations';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryChange = ({ value }: SelectableValue) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryType: value });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryType } = query;

    const queries = Object.keys(Queries).map(name => {
      return { label: name, value: name };
    });

    return (
      <div className="gf-form">
        <Select
          menuPlacement="top"
          // @ts-ignore
          menuShouldPortal={true}
          options={queries}
          onChange={this.onQueryChange}
          value={queryType}
        />
      </div>
    );
  }
}
