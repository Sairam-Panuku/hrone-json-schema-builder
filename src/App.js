import React from "react";
import {
  Button,
  Input,
  Select,
  Card,
  Space,
  Tabs,
  Switch,
} from "antd";
import {
  useForm,
  useFieldArray,
  Controller,
  useWatch,
} from "react-hook-form";
import { DownloadOutlined } from "@ant-design/icons";
import "./App.css";

const FIELD_TYPES = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Float", value: "float" },
  { label: "Boolean", value: "boolean" },
  { label: "ObjectId", value: "objectid" },
  { label: "Nested", value: "nested" },
  { label: "Array", value: "array" },
  { label: "Enum", value: "enum" },
];
function buildSchema(fields) {
  const result = {};
  fields.forEach((field) => {
    if (!field || !field.type) return;
    const key = field.key || "---";
    const schema = {};

    // Always include the type
    if (["string", "number", "boolean", "float", "objectid"].includes(field.type)) {
      schema.type = field.type;
    }

    if (field.required) schema.required = true;
    if (field.description) schema.description = field.description;
    if (field.defaultValue) schema.default = field.defaultValue;

    if (field.type === "nested") {
      schema.type = "object";
      schema.properties = buildSchema(field.children || []);
    }

    if (field.type === "array") {
      schema.type = "array";
      schema.items = {
        type: field.arrayItemType || "string"
      };
    }

    if (field.type === "enum" && field.enumValues) {
      schema.type = "string";
      schema.enum = field.enumValues.split(",").map((v) => v.trim());
    }

    result[key] = schema;
  });
  return result;
}


function FieldRow({
  control,
  parentName,
  remove,
  append,
  fields,
  setValue,
  watch,
  depth = 0,
}) {
  return (
    <div className={depth > 0 ? "nested-container" : ""}>
      {fields.map((field, idx) => {
        const fieldName = parentName
          ? `${parentName}[${idx}]`
          : `fields[${idx}]`;
        const children = watch(`${fieldName}.children`) || [];
        const currentType = watch(`${fieldName}.type`);

        return (
          <Card key={field.id} size="small" className="schema-card">
            <Space wrap align="start" size="middle" style={{ width: "100%" }}>
              <Controller
                name={`${fieldName}.key`}
                control={control}
                defaultValue={field.key}
                render={({ field: ctrl }) => (
                  <Input
                    {...ctrl}
                    placeholder="Field Name"
                    style={{ width: 140 }}
                  />
                )}
              />

              <Controller
                name={`${fieldName}.type`}
                control={control}
                defaultValue={field.type}
                render={({ field: ctrlType }) => (
                  <Select
                    {...ctrlType}
                    style={{ width: 130 }}
                    options={FIELD_TYPES}
                    onChange={(val) => {
                      ctrlType.onChange(val);
                      if (val === "nested" && !children.length) {
                        setValue(`${fieldName}.children`, [
                          { key: "", type: "string" },
                        ]);
                      } else if (val !== "nested") {
                        setValue(`${fieldName}.children`, undefined);
                      }
                    }}
                  />
                )}
              />

              <Controller
                name={`${fieldName}.required`}
                control={control}
                defaultValue={false}
                render={({ field: ctrlSwitch }) => (
                  <Switch
                    checkedChildren="Required"
                    unCheckedChildren="Optional"
                    style={{ marginRight: 8 }}
                    {...ctrlSwitch}
                    checked={ctrlSwitch.value}
                  />
                )}
              />

              {fields.length > 1 && (
                <Button danger size="small" onClick={() => remove(idx)}>
                  ❌
                </Button>
              )}
            </Space>

            <div style={{ marginTop: 8 }}>
              {/* Description */}
              <Controller
                name={`${fieldName}.description`}
                control={control}
                defaultValue=""
                render={({ field: ctrl }) => (
                  <Input
                    {...ctrl}
                    placeholder="Description"
                    style={{ width: "100%", marginBottom: 8 }}
                  />
                )}
              />

              {/* Default Value */}
              <Controller
                name={`${fieldName}.defaultValue`}
                control={control}
                defaultValue=""
                render={({ field: ctrl }) => (
                  <Input
                    {...ctrl}
                    placeholder="Default Value"
                    style={{ width: "100%", marginBottom: 8 }}
                  />
                )}
              />

              {/* Extra configs for Enum */}
              {currentType === "enum" && (
                <Controller
                  name={`${fieldName}.enumValues`}
                  control={control}
                  defaultValue=""
                  render={({ field: ctrl }) => (
                    <Input
                      {...ctrl}
                      placeholder="Enum values (comma separated)"
                      style={{ width: "100%", marginBottom: 8 }}
                    />
                  )}
                />
              )}

              {/* Array item type */}
              {currentType === "array" && (
                <Controller
                  name={`${fieldName}.arrayItemType`}
                  control={control}
                  defaultValue="string"
                  render={({ field: ctrl }) => (
                    <Select
                      {...ctrl}
                      style={{ width: 200 }}
                      options={[
                        { label: "String", value: "string" },
                        { label: "Number", value: "number" },
                        { label: "Object", value: "object" },
                      ]}
                      placeholder="Array item type"
                    />
                  )}
                />
              )}
            </div>

            {currentType === "nested" && (
              <div style={{ marginTop: 10 }}>
                <NestedFields
                  nestName={`${fieldName}.children`}
                  control={control}
                  setValue={setValue}
                  watch={watch}
                  depth={depth + 1}
                />
              </div>
            )}
          </Card>
        );
      })}

      <Button
        className="add-button"
        type="primary"
        block
        onClick={() => append({ key: "", type: "string" })}
      >
        + Add Field
      </Button>
    </div>
  );
}

function NestedFields({ nestName, control, setValue, watch, depth = 1 }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: nestName,
  });

  React.useEffect(() => {
    if (fields.length === 0) {
      append({ key: "", type: "string" });
    }
  }, []);

  return (
    <FieldRow
      control={control}
      parentName={nestName}
      append={append}
      remove={remove}
      fields={fields}
      setValue={setValue}
      watch={watch}
      depth={depth}
    />
  );
}

export default function App() {
  const { control, setValue, watch } = useForm({
    defaultValues: {
      fields: [{ key: "", type: "string" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });

  const currentFields = useWatch({ control, name: "fields" });
  const generatedSchema = buildSchema(currentFields || []);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(generatedSchema, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.json";
    a.click();
    URL.revokeObjectURL(url);
  };

 return (
  <>
    <div className="page-header">JSON Schema Builder</div>

    <div className="app-container">
      <div className="builder-section">
        <div className="section-label">🛠️ Input Section – Build Your Schema</div>

        {/* 💡 VS LINE STARTS ONLY FOR FIELDS BELOW THIS */}
        <div className="builder-fields-wrapper">
          <FieldRow
            control={control}
            fields={fields}
            parentName=""
            remove={remove}
            append={append}
            setValue={setValue}
            watch={watch}
          />
        </div>
      </div>

      <div className="preview-section">
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: (
                <div className="custom-tab-header">
                  <span>🧾 Output Section – Live JSON View</span>
                  <Button
                    className="download-button"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                </div>
              ),
              children: (
                <pre className="json-preview">
                  {JSON.stringify(generatedSchema, null, 2)}
                </pre>
              ),
            },
          ]}
        />
      </div>
    </div>
  </>
);

}
