import * as React from 'react';
import {
  Checkbox,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Radio,
  Switch,
  TextInput
} from '@patternfly/react-core';
import { GATEWAY_TOOLTIP, wizardTooltip } from './WizardHelp';
import { isValid } from 'utils/Common';

type Props = {
  serviceName: string;
  hasGateway: boolean;
  gateway: string;
  isMesh: boolean;
  gateways: string[];
  vsHosts: string[];
  onGatewayChange: (valid: boolean, gateway: GatewaySelectorState) => void;
};

export type GatewaySelectorState = {
  addGateway: boolean;
  gwHosts: string;
  gwHostsValid: boolean;
  newGateway: boolean;
  selectedGateway: string;
  addMesh: boolean;
  port: number;
};

enum GatewayForm {
  SWITCH,
  MESH,
  GW_HOSTS,
  SELECT,
  GATEWAY_SELECTED,
  PORT
}

export class GatewaySelector extends React.Component<Props, GatewaySelectorState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      addGateway: props.hasGateway,
      gwHosts: '*',
      gwHostsValid: true,
      newGateway: props.gateways.length === 0,
      selectedGateway: props.gateways.length > 0 ? (props.gateway !== '' ? props.gateway : props.gateways[0]) : '',
      addMesh: props.isMesh,
      port: 80
    };
  }

  checkGwHosts = (gwHosts: string): boolean => {
    const hosts = gwHosts.split(',');
    for (let i = 0; i < hosts.length; i++) {
      if (hosts[i] === '*') {
        continue;
      }
      if (!hosts[i].includes('.')) {
        return false;
      }
    }
    return true;
  };

  onFormChange = (component: GatewayForm, value: string) => {
    switch (component) {
      case GatewayForm.SWITCH:
        this.setState(
          prevState => {
            return {
              addGateway: !prevState.addGateway
            };
          },
          () => this.props.onGatewayChange(this.isGatewayValid(), this.state)
        );
        break;
      case GatewayForm.MESH:
        this.setState(
          prevState => {
            return {
              addMesh: !prevState.addMesh
            };
          },
          () => this.props.onGatewayChange(this.isGatewayValid(), this.state)
        );
        break;
      case GatewayForm.GW_HOSTS:
        this.setState(
          {
            gwHosts: value,
            gwHostsValid: this.checkGwHosts(value)
          },
          () => this.props.onGatewayChange(this.isGatewayValid(), this.state)
        );
        break;
      case GatewayForm.SELECT:
        this.setState(
          {
            newGateway: value === 'true'
          },
          () => this.props.onGatewayChange(this.isGatewayValid(), this.state)
        );
        break;
      case GatewayForm.GATEWAY_SELECTED:
        this.setState(
          {
            selectedGateway: value
          },
          () => this.props.onGatewayChange(this.isGatewayValid(), this.state)
        );
        break;
      case GatewayForm.PORT:
        this.setState(
          {
            port: +value
          },
          () => this.props.onGatewayChange(this.isGatewayValid(), this.state)
        );
        break;
      default:
      // No default action
    }
  };

  isMeshGatewayValid = (): boolean => {
    const hasVsWildcard = this.props.vsHosts.some(h => h === '*');
    const hasGwWildcard = this.state.gwHosts.split(',').some(h => h === '*');
    // Gateway added
    if (this.state.addGateway) {
      // Mesh can't use wildcard in the hosts
      if (this.state.addMesh) {
        if (this.state.newGateway) {
          // If mesh, a new gateway can't use wildcard
          return !hasGwWildcard;
        } else {
          // If mesh, a selected gateway can't use wildcard
          return !hasVsWildcard;
        }
      }
      return true;
    } else {
      // No gateway means that mesh is used by default
      // Mesh can't use wildcard in the hosts
      return !hasVsWildcard;
    }
  };

  isGatewayValid = (): boolean => {
    // gwHostsValid is used as last validation, it's true by default
    return this.isMeshGatewayValid() && this.state.gwHostsValid;
  };

  render() {
    return (
      <Form isHorizontal={true}>
        <FormGroup label="Add Gateway" fieldId="gatewaySwitch">
          <Switch
            id="advanced-gwSwitch"
            label={' '}
            labelOff={' '}
            isChecked={this.state.addGateway}
            onChange={() => this.onFormChange(GatewayForm.SWITCH, '')}
          />
          <span>{wizardTooltip(GATEWAY_TOOLTIP)}</span>
        </FormGroup>
        {this.state.addGateway && (
          <>
            <FormGroup fieldId="includeMesh">
              <Checkbox
                id="includeMesh"
                label={
                  <>
                    Include <b>mesh</b> gateway
                  </>
                }
                isDisabled={!this.state.addGateway}
                isChecked={this.state.addMesh}
                onChange={() => this.onFormChange(GatewayForm.MESH, '')}
              />
              {!isValid(this.isMeshGatewayValid()) && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>VirtualService Host '*' wildcard not allowed on mesh gateway.</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
            <FormGroup fieldId="selectGateway">
              <Radio
                id="existingGateway"
                name="selectGateway"
                label="Select Gateway"
                isDisabled={!this.state.addGateway || this.props.gateways.length === 0}
                isChecked={!this.state.newGateway}
                onChange={() => this.onFormChange(GatewayForm.SELECT, 'false')}
              />
              <Radio
                id="createGateway"
                name="selectGateway"
                label="Create Gateway"
                isDisabled={!this.state.addGateway}
                isChecked={this.state.newGateway}
                onChange={() => this.onFormChange(GatewayForm.SELECT, 'true')}
              />
            </FormGroup>
            {!this.state.newGateway && (
              <FormGroup fieldId="selectGateway" label="Gateway">
                {this.props.gateways.length > 0 && (
                  <FormSelect
                    id="selectGateway"
                    value={this.state.selectedGateway}
                    isDisabled={!this.state.addGateway || this.state.newGateway || this.props.gateways.length === 0}
                    onChange={(_event, gw: string) => this.onFormChange(GatewayForm.GATEWAY_SELECTED, gw)}
                  >
                    {this.props.gateways.map(gw => (
                      <FormSelectOption key={gw} value={gw} label={gw} />
                    ))}
                  </FormSelect>
                )}
                {this.props.gateways.length === 0 && <>There are no gateways to select.</>}
              </FormGroup>
            )}
            {this.state.newGateway && (
              <>
                <FormGroup fieldId="gwPort" label="Port">
                  <TextInput
                    id="gwPort"
                    name="gwPort"
                    type="number"
                    isDisabled={!this.state.addGateway || !this.state.newGateway}
                    value={this.state.port}
                    onChange={(_event, value) => this.onFormChange(GatewayForm.PORT, value)}
                  />
                </FormGroup>
                <FormGroup fieldId="gwHosts" label="Gateway Hosts">
                  <TextInput
                    id="gwHosts"
                    name="gwHosts"
                    isDisabled={!this.state.addGateway || !this.state.newGateway}
                    value={this.state.gwHosts}
                    onChange={(_event, value) => this.onFormChange(GatewayForm.GW_HOSTS, value)}
                    validated={isValid(this.state.gwHostsValid)}
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        {isValid(this.state.gwHostsValid)
                          ? 'One or more hosts exposed by this gateway. Enter one or multiple hosts separated by comma.'
                          : "Gateway hosts should be specified using FQDN format or '*' wildcard."}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </>
            )}
          </>
        )}
      </Form>
    );
  }
}
