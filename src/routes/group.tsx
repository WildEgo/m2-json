import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, EyeIcon, EyeOffIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  entryRegex,
  groupRegex,
  leaderRegex,
  vnumRegex,
} from "@/lib/matches/group";

export interface MobGroup {
  $schema: string;
  rows: MobGroupRow[];
}

export interface MobGroupRow {
  vnum: number;
  name?: string;
  leader: number;
  mobs: number[];
}

const searchParams = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
  query: parseAsString.withDefault(""),
};

const schema = z.object({
  input: z.string().nonempty(),
});

export const Route = createFileRoute("/group")({
  component: RouteComponent,
  validateSearch: createStandardSchemaV1(searchParams, {
    partialOutput: true,
  }),
  beforeLoad: () => {
    return {
      title: "Group",
    };
  },
});

const columns: ColumnDef<MobGroupRow>[] = [
  {
    accessorKey: "vnum",
    header: "Identifier (VNUM)",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "mobs",
    cell: ({ row, getValue }) => {
      const value = getValue<number[]>();

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
    header: "Mobs",
  },
];

function RouteComponent() {
  const [result, setResult, deleteResult] = useLocalStorage<MobGroup | null>(
    "group",
    null
  );
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
          "https://raw.githubusercontent.com/WildEgo/m2-json-schemas/refs/heads/main/group.json",
        rows: [],
      } as MobGroup;

      groupFor: for (const group of groups) {
        if (!group[1]) {
          continue;
        }

        const vnum = vnumRegex.exec(group[2])?.[1];
        if (!vnum) {
          setErrors((e) => [...e, group[1]]);
          continue;
        }

        const leader = leaderRegex.exec(group[2])?.[1];
        if (!leader) {
          setErrors((e) => [...e, `${group[1]} - Missing leader`]);
          continue;
        }

        const mobs: number[] = [];
        for (const r of group[2].matchAll(entryRegex)) {
          mobs.push(Number(r[2]));
        }

        const row: MobGroupRow = {
          vnum: Number(vnum),
          name: group[1],
          leader: Number(leader),
          mobs,
        };

        output.rows.push(row);
      }

      setResult(output);

      toast("You have successfully generated group.json", {
        position: "bottom-right",
      });
    },
  });

  return (
    <div className="px-4 lg:px-6">
      <h1 className="text-2xl font-bold mb-4">Group</h1>
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
                  <FieldLabel htmlFor={field.name}>group.txt</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Fully paste your group.txt file's contents here."
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={isInvalid}
                    />
                  </InputGroup>
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
                  !!row.getValue<MobGroupRow["mobs"]>("mobs").length
                }
                renderSubRows={(row) => {
                  const id = row.getValue<number>("vnum");
                  const rows = row.getValue<MobGroupRow["mobs"]>("mobs");

                  return (
                    <div className="bg-muted/50 border-b">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent!">
                            <TableHead>Identifier (VNUM)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(rows as MobGroupRow["mobs"]).map((r, index) => (
                            <TableRow
                              key={`${id}.${index}`}
                              className="hover:bg-muted"
                            >
                              <TableCell>{r}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
