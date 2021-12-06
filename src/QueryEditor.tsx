import { defaults } from 'lodash';

import React, { PureComponent, useCallback, useState, useEffect } from 'react';
import { Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { Queries } from './data/transform/transformations';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export const QueryEditor = (props: Props) => {
  const onQueryChange = ({ value }: SelectableValue) => {
    props.onChange({ ...props.query, queryType: value });
    props.onRunQuery();
  };

  const onFileChange = ({ value }: SelectableValue) => {
    props.onChange({ ...props.query, file: value });
    props.onRunQuery();
  };

  const query = defaults(props.query, defaultQuery);
  const { queryType, file } = query;

  const queries = Object.keys(Queries).map(name => {
    return { label: name, value: name };
  });

  const [files, setFiles] = useState([]);

  useEffect(() => {
    async function load() {
      const files = await props.datasource.getFiles();
      const options = files.map(name => {
        return {
          label: name,
          value: name,
        };
      });
      setFiles(options);
    }
    load();
  }, []);

  return (
    <div className="gf-form">
      <Select onChange={onFileChange} options={files} value={file} />
      <Select
        // @ts-ignore
        menuShouldPortal={true}
        options={queries}
        onChange={onQueryChange}
        value={queryType}
      />
    </div>
  );
};
