import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { match, P } from "ts-pattern";
import {
  createStandardSchemaV1,
  parseAsIndex,
  parseAsInteger,
  parseAsString,
} from "nuqs";
import { AnimatePresence, motion } from "motion/react";
import { useLocalStorage } from "usehooks-ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface SpecialItemGroup {
  $schema: string;
  rows: SpecialItemGroupRow[];
}

export type SpecialItemGroupRow =
  | AttributeRow
  | PercentageRow
  | QuestRow
  | SpecialRow
  | NormalRow;

interface BaseRow {
  name: string;
  type: "percentage" | "attribute" | "quest" | "special" | "normal";
  vnum: number;
  effect?: string | null;
}

export interface AttributeRow extends BaseRow {
  type: "attribute";
  rows: {
    apply_type: number;
    apply_value: number;
  }[];
}

export interface PercentageRow extends BaseRow {
  type: "percentage";
  rows: CommonRowItem[];
}

export interface QuestRow extends BaseRow {
  type: "quest";
  rows: CommonRowItem[];
}

export interface SpecialRow extends BaseRow {
  type: "special";
  rows: CommonRowItem[];
}

export interface NormalRow extends BaseRow {
  type: "normal";
  rows: CommonRowItem[];
}

export interface CommonRowItem {
  vnum:
    | number
    | "exp"
    | "mob"
    | "slow"
    | "drain_hp"
    | "poison"
    | "group"
    | "gold";
  count: number;
  probability: number;
  rare_percentage: number;
  sockets?: number[];
}

const searchParams = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
  query: parseAsString.withDefault(""),
};

export const Route = createFileRoute("/special-item-group")({
  component: RouteComponent,
  validateSearch: createStandardSchemaV1(searchParams, {
    partialOutput: true,
  }),
  beforeLoad: () => {
    return {
      title: "Special Item Group",
    };
  },
});

const schema = z.object({
  input: z.string().nonempty(),
});

const groupRegex = /Group\s+([^\n]+)\s*\n\{([^}]*)\}/gim;
const typeRegex = /Type\t([a-zA-Z]+)/im;
const vnumRegex = /Vnum\t([a-zA-Z0-9]+)/im;
const effectRegex = /Effect\t"([^"]*)"/im;
const normalRegex = /([0-9]+)\t([^\t]+)\t([0-9]+)\t([0-9]+)(?:\t([0-9]+))?/gim;
const attributeRegex = /([0-9]+)\t([0-9]+)/gim;

const processNormalRegex = (r: RegExpExecArray): CommonRowItem => {
  return {
    vnum: match(r[2])
      .with(P.number, (value) => Number(value))
      .with(P.union("경험치", "exp"), () => "exp" as const)
      .with(P.union("돈꾸러미", "gold"), () => "gold" as const)
      .with(P.union("group", "poison", "mob", "slow", "drain_hp"), (v) => v)
      .otherwise((value) => Number(value)),
    count: Number(r[3]),
    probability: Number(r[4] || 0),
    rare_percentage: Number(r[5] || 0),
  };
};

const columns: ColumnDef<SpecialItemGroupRow>[] = [
  {
    accessorKey: "vnum",
    header: "Identifier (VNUM)",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: (c) => <span className="capitalize">{c.getValue<string>()}</span>,
  },
  {
    accessorKey: "rows",
    cell: ({ row, getValue }) => {
      const value = getValue<BaseRow[]>();

      return row.getCanExpand() ? (
        <button
          type="button"
          onClick={row.getToggleExpandedHandler()}
          className="flex flex-row items-center gap-2 cursor-pointer"
        >
          {value.length}
          <div className="relative w-4 h-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {row.getIsExpanded() ? (
                <motion.div
                  key="eye-off"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <EyeOffIcon className="size-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="eye"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <EyeIcon className="size-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </button>
      ) : (
        value.length
      );
    },
    header: "Rows",
  },
  {
    accessorKey: "effect",
    header: "Effect",
    cell: (c) => (
      <Tooltip>
        <TooltipTrigger asChild>
          {c.getValue() ? <CheckIcon /> : <XIcon />}
        </TooltipTrigger>
        <TooltipContent>{c.getValue<string>() || "No effect"}</TooltipContent>
      </Tooltip>
    ),
  },
];

function RouteComponent() {
  const [result, setResult, deleteResult] =
    useLocalStorage<SpecialItemGroup | null>("special-item-group", null);
  const [errors, setErrors] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      input: "",
    },
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      setErrors([]);
      setResult(null);
      const groups = value.input.matchAll(groupRegex);

      if (!groups) {
        throw new Error("No groups found.");
      }

      let output = {
        $schema:
          "https://raw.githubusercontent.com/WildEgo/m2-json-schemas/refs/heads/main/special_item_group.json",
        rows: [],
      } as SpecialItemGroup;

      groupFor: for (const group of groups) {
        if (!group[1]) {
          continue;
        }

        const type: BaseRow["type"] = match(typeRegex.exec(group[2])?.[1])
          .with(P.nullish, () => "normal" as const)
          .with(
            P.when((v) => v.toLocaleLowerCase() === "pct"),
            () => "percentage" as const
          )
          .with(
            P.when((v) => v.toLocaleLowerCase() === "special"),
            () => "special" as const
          )
          .with(
            P.when((v) => v.toLocaleLowerCase() === "attr"),
            () => "attribute" as const
          )
          .with(
            P.when((v) => v.toLocaleLowerCase() === "quest"),
            () => "quest" as const
          )
          .otherwise(() => "normal" as const);

        const vnum = vnumRegex.exec(group[2])?.[1];
        const effect = effectRegex.exec(group[2])?.[1] || null;

        if (!vnum) {
          setErrors((e) => [...e, group[1]]);
          continue;
        }

        const row = match(type)
          .with(P.union("normal", "percentage", "quest", "special"), (type) => {
            const rows: CommonRowItem[] = [];

            for (const r of group[2].matchAll(normalRegex)) {
              const value = processNormalRegex(r);
              if (!value.vnum) {
                setErrors((e) => [...e, `${group[1]} - ${r[1]}`]);
                break;
              }

              rows.push(value);
            }

            return {
              name: group[1],
              vnum: Number(vnum),
              type,
              rows,
              effect,
            } satisfies SpecialItemGroupRow;
          })
          .with("attribute", (type) => {
            const rows: AttributeRow["rows"] = [];
            for (const r of group[2].matchAll(attributeRegex)) {
              rows.push({
                apply_type: Number(r[1]),
                apply_value: Number(r[2]),
              });
            }

            return {
              name: group[1],
              vnum: Number(vnum),
              type,
              rows,
              effect,
            } satisfies AttributeRow;
          })
          .exhaustive();

        output.rows.push(row);
      }

      setResult(output);

      toast("You submitted the following values:", {
        position: "bottom-left",
      });
    },
  });

  return (
    <div className="px-4 lg:px-6">
      <h1 className="text-2xl font-bold mb-4">Special Item Group</h1>
      <form
        id="special-item-group"
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field
            name="input"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    special_item_group.txt
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Fully paste your special_item_group.txt file's contents here."
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={isInvalid}
                    />
                  </InputGroup>
                  <FieldDescription>
                    Please for this to work nicely use proper encoding as Yang
                    should be "<code>돈꾸러미</code>" or "<code>gold</code>" and
                    Experience "<code>경험치</code>" or "<code>exp</code>"
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>
        {!!errors.length && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>
              There were issues while parsing the following rows.
            </AlertTitle>
            <AlertDescription>
              <p>Please verify your file and try again.</p>
              <ul className="list-inside list-disc text-sm">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              deleteResult();
              setErrors([]);
            }}
          >
            Reset
          </Button>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit}>
                Submit {isSubmitting && <LoaderIcon className="animate-spin" />}
              </Button>
            )}
          />
        </Field>
        {!!result && (
          <Tabs defaultValue="preview">
            <TabsList className="w-full">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <DataTable
                columns={columns}
                data={result.rows}
                getRowCanExpand={(row) =>
                  !!row.getValue<SpecialItemGroup["rows"]>("rows").length
                }
                renderSubRows={(row) => {
                  const id = row.getValue<number>("vnum");
                  const type =
                    row.getValue<SpecialItemGroup["rows"][0]["type"]>("type");
                  const rows =
                    row.getValue<SpecialItemGroup["rows"][0]["rows"]>("rows");

                  return (
                    <div className="bg-muted/50 border-b">
                      {match(type)
                        .with("attribute", () => "Attributes")
                        .otherwise(() => (
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent!">
                                <TableHead>Identifier (VNUM)</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Probability</TableHead>
                                <TableHead>Rare percentage</TableHead>
                                <TableHead>Sockets</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(rows as CommonRowItem[]).map((r) => (
                                <TableRow
                                  key={`${id}.${r.vnum}`}
                                  className="hover:bg-muted"
                                >
                                  <TableCell>{r.vnum}</TableCell>
                                  <TableCell>{r.count}</TableCell>
                                  <TableCell>{r.probability}%</TableCell>
                                  <TableCell>{r.rare_percentage}%</TableCell>
                                  <TableCell>
                                    {!!r.sockets?.length ? (
                                      <ol className="list-decimal list-inside">
                                        {r.sockets.map((socket, socketIdx) => (
                                          <li
                                            key={`${id}.${r.vnum}.${socketIdx}`}
                                          >
                                            {socket}
                                          </li>
                                        ))}
                                      </ol>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        No sockets
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ))}
                    </div>
                  );
                }}
              />
            </TabsContent>
            <TabsContent value="content">
              <Textarea
                value={JSON.stringify(result, null, 2)}
                readOnly
                rows={12}
                onFocus={(e) => e.target.select()}
              />
            </TabsContent>
          </Tabs>
        )}
      </form>
    </div>
  );
}
