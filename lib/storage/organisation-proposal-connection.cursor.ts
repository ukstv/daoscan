interface Props {
  readonly index: number;
}

export class OrganisationProposalConnectionCursor {
  constructor(readonly index: number) {}

  static build(props: Props) {
    return new OrganisationProposalConnectionCursor(props.index);
  }

  static decode(raw: string): OrganisationProposalConnectionCursor {
    const buffer = Buffer.from(raw, "base64").toString();
    const payload = JSON.parse(buffer);
    return OrganisationProposalConnectionCursor.build(payload);
  }

  encode(): string {
    const payload = {
      index: this.index
    };
    const string = JSON.stringify(payload);
    return Buffer.from(string).toString("base64");
  }
}
